import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { InboundOrderWebhookInput } from "./erp-integration.schema";

// Couche d'intégration ERP KITEA (SAP / Dynamics / Oracle / Odoo...).
// Chaque échange est journalisé dans ErpSyncLog pour traçabilité et rejeu
// en cas d'échec (idempotence à assurer côté ERP via erpSourceRef).
export const erpIntegrationService = {
  // INBOUND : réception d'une commande/réassort/transfert depuis l'ERP.
  async handleInboundOrder(payload: InboundOrderWebhookInput) {
    const log = await prisma.erpSyncLog.create({
      data: { direction: "INBOUND", eventType: payload.eventType, payload, status: "PENDING" },
    });

    try {
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
