import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import {
  buildTemplateBuffer,
  buildWorkbookBuffer,
  coerceCellNumber,
  coerceCellString,
  parseWorkbookBuffer,
} from "../../common/utils/excel";
import { LOCATION_EXPORT_COLUMNS, LOCATION_IMPORT_COLUMNS, toLocationExportRow } from "./locations.excel";
import {
  CreateLocationInput,
  ImportLocationsResult,
  UpdateLocationInput,
  importLocationRowSchema,
} from "./locations.schema";

export const locationsService = {
  list(filters: { type?: string; city?: string; includeInactive?: boolean }) {
    return prisma.location.findMany({
      where: {
        type: filters.type as never,
        city: filters.city ? { equals: filters.city, mode: "insensitive" } : undefined,
        isActive: filters.includeInactive ? undefined : true,
      },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) throw AppError.notFound("Site");
    return location;
  },

  async create(input: CreateLocationInput) {
    const existing = await prisma.location.findUnique({ where: { code: input.code } });
    if (existing) throw AppError.conflict(`Le code site "${input.code}" existe déjà`);
    return prisma.location.create({ data: input });
  },

  async update(id: string, input: UpdateLocationInput) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: input });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: { isActive: true } });
  },

  async exportToExcel(): Promise<Buffer> {
    const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
    return buildWorkbookBuffer("Sites KITEA", LOCATION_EXPORT_COLUMNS, locations.map(toLocationExportRow));
  },

  downloadImportTemplate(): Promise<Buffer> {
    return buildTemplateBuffer("Sites KITEA", LOCATION_IMPORT_COLUMNS);
  },

  // Import en masse (Excel) : upsert par `code` — un site déjà connu est mis
  // à jour (utile pour corriger des coordonnées approximées), un code
  // inconnu est créé.
  async importFromExcel(buffer: Buffer): Promise<ImportLocationsResult> {
    const rows = await parseWorkbookBuffer(buffer, LOCATION_IMPORT_COLUMNS);
    const result: ImportLocationsResult = { totalRows: rows.length, created: 0, updated: 0, errors: [] };

    for (const row of rows) {
      const raw = {
        code: coerceCellString(row.values.code),
        name: coerceCellString(row.values.name),
        type: coerceCellString(row.values.type)?.toUpperCase(),
        city: coerceCellString(row.values.city),
        region: coerceCellString(row.values.region),
        country: coerceCellString(row.values.country) ?? "MA",
        address: coerceCellString(row.values.address),
        latitude: coerceCellNumber(row.values.latitude),
        longitude: coerceCellNumber(row.values.longitude),
        storageAreaM2: coerceCellNumber(row.values.storageAreaM2),
        storageVolumeM3: coerceCellNumber(row.values.storageVolumeM3),
        bufferStockUnits: coerceCellNumber(row.values.bufferStockUnits),
        deliveryWindowStart: coerceCellString(row.values.deliveryWindowStart),
        deliveryWindowEnd: coerceCellString(row.values.deliveryWindowEnd),
        truckAccessRestriction: coerceCellString(row.values.truckAccessRestriction),
        operatingDays: coerceCellString(row.values.operatingDays),
        operatorName: coerceCellString(row.values.operatorName),
      };

      const parsed = importLocationRowSchema.safeParse(raw);
      if (!parsed.success) {
        result.errors.push({ row: row.rowNumber, message: parsed.error.issues[0]?.message ?? "Ligne invalide" });
        continue;
      }

      const data = parsed.data;
      const existing = await prisma.location.findUnique({ where: { code: data.code } });

      if (existing) {
        await prisma.location.update({ where: { code: data.code }, data });
        result.updated += 1;
      } else {
        await prisma.location.create({ data });
        result.created += 1;
      }
    }

    return result;
  },
};
