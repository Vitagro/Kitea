import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import {
  buildTemplateBuffer,
  coerceCellDate,
  coerceCellNumber,
  coerceCellString,
  parseWorkbookBuffer,
} from "../../common/utils/excel";
import { ERP_ORDER_IMPORT_COLUMNS } from "./erp-integration.excel";
import {
  BulkOrderItem,
  ErpImportResult,
  InboundOrderWebhookInput,
  erpImportOrderRowSchema,
} from "./erp-integration.schema";

// Couche d'intégration ERP KITEA (SAP / Dynamics / Oracle / Odoo...).
// Chaque échange est journalisé dans ErpSyncLog pour traçabilité et rejeu
// en cas d'échec (idempotence à assurer côté ERP via erpSourceRef).
export const erpIntegrationService = {
  // INBOUND : réception d'une commande/réassort/transfert depuis l'ERP
  // (webhook temps réel, unitaire).
  async handleInboundOrder(payload: InboundOrderWebhookInput) {
    const log = await prisma.erpSyncLog.create({
      data: { direction: "INBOUND", eventType: payload.eventType, payload, status: "PENDING" },
    });

    try {
      const existing = await prisma.order.findUnique({ where: { reference: payload.reference } });
      if (existing) throw AppError.conflict(`La commande "${payload.reference}" existe déjà`);

      const [origin, destination] = await Promise.all([
        prisma.location.findUnique({ where: { code: payload.originCode } }),
        prisma.location.findUnique({ where: { code: payload.destinationCode } }),
      ]);
      if (!origin) throw AppError.badRequest(`Site origine inconnu: ${payload.originCode}`);
      if (!destination) throw AppError.badRequest(`Site destination inconnu: ${payload.destinationCode}`);

      const order = await prisma.order.create({
        data: {
          reference: payload.reference,
          erpSourceRef: payload.erpSourceRef,
          originLocationId: origin.id,
          destinationLocationId: destination.id,
          volumeM3: payload.volumeM3,
          weightKg: payload.weightKg,
          deliveryWindowStart: payload.deliveryWindowStart,
          deliveryWindowEnd: payload.deliveryWindowEnd,
        },
      });

      await prisma.erpSyncLog.update({
        where: { id: log.id },
        data: { status: "SUCCESS", processedAt: new Date() },
      });

      return order;
    } catch (error) {
      await prisma.erpSyncLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          processedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
        },
      });
      throw error;
    }
  },

  // INBOUND : import en masse (lot JSON) — synchronisation ponctuelle ou
  // planifiée de plusieurs commandes ERP en une seule requête. Chaque item
  // est traité et journalisé indépendamment via handleInboundOrder : un
  // item invalide n'interrompt pas le reste du lot.
  async importOrdersBatch(items: BulkOrderItem[]): Promise<ErpImportResult> {
    const result: ErpImportResult = { totalRows: items.length, imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < items.length; i += 1) {
      try {
        await this.handleInboundOrder({ eventType: "ORDER_CREATED", ...items[i] });
        result.imported += 1;
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 409) result.skipped += 1;
        result.errors.push({ row: i + 1, message: error instanceof Error ? error.message : "Erreur inconnue" });
      }
    }

    return result;
  },

  // INBOUND : import en masse depuis un export Excel de l'ERP (motif
  // fréquent en pratique : beaucoup d'ERP exportent leurs commandes en
  // .xlsx plutôt que d'appeler un webhook en temps réel).
  async importOrdersFromExcel(buffer: Buffer): Promise<ErpImportResult> {
    const rows = await parseWorkbookBuffer(buffer, ERP_ORDER_IMPORT_COLUMNS);
    const result: ErpImportResult = { totalRows: rows.length, imported: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      const raw = {
        reference: coerceCellString(row.values.reference),
        originCode: coerceCellString(row.values.originCode),
        destinationCode: coerceCellString(row.values.destinationCode),
        volumeM3: coerceCellNumber(row.values.volumeM3),
        weightKg: coerceCellNumber(row.values.weightKg),
        deliveryWindowStart: coerceCellDate(row.values.deliveryWindowStart),
        deliveryWindowEnd: coerceCellDate(row.values.deliveryWindowEnd),
        erpSourceRef: coerceCellString(row.values.erpSourceRef),
      };

      const parsed = erpImportOrderRowSchema.safeParse(raw);
      if (!parsed.success) {
        result.errors.push({ row: row.rowNumber, message: parsed.error.issues[0]?.message ?? "Ligne invalide" });
        continue;
      }

      try {
        await this.handleInboundOrder({ eventType: "ORDER_CREATED", ...parsed.data });
        result.imported += 1;
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 409) result.skipped += 1;
        result.errors.push({ row: row.rowNumber, message: error instanceof Error ? error.message : "Erreur inconnue" });
      }
    }

    return result;
  },

  downloadImportTemplate(): Promise<Buffer> {
    return buildTemplateBuffer("Commandes ERP", ERP_ORDER_IMPORT_COLUMNS);
  },

  // OUTBOUND : notifie l'ERP d'un statut d'expédition mis à jour.
  // (transport HTTP réel vers l'ERP à brancher via env.erpBaseUrl)
  async logOutboundShipmentStatus(shipmentId: string, status: string) {
    return prisma.erpSyncLog.create({
      data: {
        direction: "OUTBOUND",
        eventType: "SHIPMENT_STATUS_UPDATED",
        payload: { shipmentId, status },
        status: "PENDING",
      },
    });
  },

  // OUTBOUND : notifie l'ERP d'une pré-facture validée (imputation comptable).
  async logOutboundPreInvoiceValidated(preInvoiceId: string) {
    return prisma.erpSyncLog.create({
      data: {
        direction: "OUTBOUND",
        eventType: "PRE_INVOICE_VALIDATED",
        payload: { preInvoiceId },
        status: "PENDING",
      },
    });
  },

  listLogs(direction?: "INBOUND" | "OUTBOUND") {
    return prisma.erpSyncLog.findMany({
      where: { direction },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },
};
