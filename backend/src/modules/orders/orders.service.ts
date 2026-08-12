import { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import {
  buildTemplateBuffer,
  buildWorkbookBuffer,
  coerceCellBoolean,
  coerceCellDate,
  coerceCellNumber,
  coerceCellString,
  parseWorkbookBuffer,
} from "../../common/utils/excel";
import { CreateOrderInput, ImportOrdersResult, importOrderRowSchema } from "./orders.schema";
import { ORDER_EXPORT_COLUMNS, ORDER_IMPORT_COLUMNS, toOrderExportRow } from "./orders.excel";

export const ordersService = {
  list(status?: OrderStatus) {
    return prisma.order.findMany({
      where: { status },
      include: { origin: true, destination: true, shipment: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { origin: true, destination: true, shipment: true },
    });
    if (!order) throw AppError.notFound("Commande");
    return order;
  },

  async create(input: CreateOrderInput) {
    const existing = await prisma.order.findUnique({ where: { reference: input.reference } });
    if (existing) throw AppError.conflict(`La commande "${input.reference}" existe déjà`);
    return prisma.order.create({ data: input });
  },

  async cancel(id: string) {
    await this.getById(id);
    return prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
  },

  async exportToExcel(status?: OrderStatus): Promise<Buffer> {
    const orders = await prisma.order.findMany({
      where: { status },
      include: { origin: true, destination: true },
      orderBy: { createdAt: "desc" },
    });
    return buildWorkbookBuffer("Commandes", ORDER_EXPORT_COLUMNS, orders.map(toOrderExportRow));
  },

  downloadImportTemplate(): Promise<Buffer> {
    return buildTemplateBuffer("Commandes", ORDER_IMPORT_COLUMNS);
  },

  // Import en masse depuis un fichier Excel (saisie manuelle côté planification
  // transport). Traite chaque ligne indépendamment : une ligne invalide ou en
  // doublon est reportée en erreur sans bloquer les autres.
  async importFromExcel(buffer: Buffer): Promise<ImportOrdersResult> {
    const rows = await parseWorkbookBuffer(buffer, ORDER_IMPORT_COLUMNS);
    const result: ImportOrdersResult = { totalRows: rows.length, created: 0, skipped: 0, errors: [] };

    const locationCache = new Map<string, string | null>();
    async function resolveLocationId(code: string): Promise<string | null> {
      if (locationCache.has(code)) return locationCache.get(code) ?? null;
      const location = await prisma.location.findUnique({ where: { code } });
      locationCache.set(code, location?.id ?? null);
      return location?.id ?? null;
    }

    for (const row of rows) {
      const raw = {
        reference: coerceCellString(row.values.reference),
        originCode: coerceCellString(row.values.originCode),
        destinationCode: coerceCellString(row.values.destinationCode),
        volumeM3: coerceCellNumber(row.values.volumeM3),
        weightKg: coerceCellNumber(row.values.weightKg),
        isFragile: coerceCellBoolean(row.values.isFragile, false),
        isStackable: coerceCellBoolean(row.values.isStackable, true),
        deliveryWindowStart: coerceCellDate(row.values.deliveryWindowStart),
        deliveryWindowEnd: coerceCellDate(row.values.deliveryWindowEnd),
        erpSourceRef: coerceCellString(row.values.erpSourceRef),
      };

      const parsed = importOrderRowSchema.safeParse(raw);
      if (!parsed.success) {
        result.errors.push({ row: row.rowNumber, message: parsed.error.issues[0]?.message ?? "Ligne invalide" });
        continue;
      }

      const data = parsed.data;

      const existing = await prisma.order.findUnique({ where: { reference: data.reference } });
      if (existing) {
        result.skipped += 1;
        result.errors.push({ row: row.rowNumber, message: `Commande "${data.reference}" déjà existante — ignorée` });
        continue;
      }

      const [originId, destinationId] = await Promise.all([
        resolveLocationId(data.originCode),
        resolveLocationId(data.destinationCode),
      ]);
      if (!originId) {
        result.errors.push({ row: row.rowNumber, message: `Site origine inconnu: ${data.originCode}` });
        continue;
      }
      if (!destinationId) {
        result.errors.push({ row: row.rowNumber, message: `Site destination inconnu: ${data.destinationCode}` });
        continue;
      }

      await prisma.order.create({
        data: {
          reference: data.reference,
          originLocationId: originId,
          destinationLocationId: destinationId,
          volumeM3: data.volumeM3,
          weightKg: data.weightKg,
          isFragile: data.isFragile,
          isStackable: data.isStackable,
          deliveryWindowStart: data.deliveryWindowStart,
          deliveryWindowEnd: data.deliveryWindowEnd,
          erpSourceRef: data.erpSourceRef,
        },
      });
      result.created += 1;
    }

    return result;
  },
};
