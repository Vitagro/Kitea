import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import {
  buildTemplateBuffer,
  buildWorkbookBuffer,
  coerceCellNumber,
  coerceCellString,
  parseWorkbookBuffer,
} from "../../common/utils/excel";
import { buildGoogleMapsPlaceUrl, buildGoogleMapsSearchUrl } from "../../common/utils/googleMaps";
import { geocodeAddress, searchPlacesText } from "./geocoding.service";
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
    return prisma.location.create({
      data: {
        ...input,
        googleMapsUrl: input.googleMapsUrl || buildGoogleMapsSearchUrl(input),
      },
    });
  },

  async update(id: string, input: UpdateLocationInput) {
    const current = await this.getById(id);
    const merged = { ...current, ...input };
    return prisma.location.update({
      where: { id },
      data: {
        ...input,
        googleMapsUrl: input.googleMapsUrl || current.googleMapsUrl || buildGoogleMapsSearchUrl(merged),
      },
    });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: { isActive: true } });
  },

  // Résout les coordonnées précises + Place ID via l'API Google Geocoding,
  // à partir du nom/adresse/ville déjà saisis. Écrase latitude/longitude
  // (jusque-là potentiellement approximées) et le lien Google Maps.
  async geocode(id: string) {
    const location = await this.getById(id);
    const query = [location.name, location.address, location.city, location.country]
      .filter(Boolean)
      .join(", ");

    const result = await geocodeAddress(query);

    return prisma.location.update({
      where: { id },
      data: {
        latitude: result.latitude,
        longitude: result.longitude,
        googlePlaceId: result.placeId,
        googleMapsUrl: buildGoogleMapsPlaceUrl(result.placeId),
      },
    });
  },

  // Découverte automatique du réseau depuis Google Maps : recherche tous les
  // établissements correspondant à `query`, puis pour chacun :
  //  - déjà connu (googlePlaceId existant)   -> UPDATE (coordonnées/adresse)
  //  - fermé/introuvable côté Google         -> SKIP
  //  - nouveau                                -> CREATE (type STORE par défaut,
  //    à corriger manuellement si c'est en fait un dépôt/hub)
  // `dryRun=true` (par défaut) ne fait qu'une simulation : rien n'est écrit,
  // seule la liste des actions proposées est renvoyée pour validation.
  async syncFromGooglePlaces(query: string, dryRun = true) {
    const places = await searchPlacesText(query);
    const items: {
      placeId: string;
      name: string;
      formattedAddress: string;
      action: "CREATE" | "UPDATE" | "SKIP";
      reason?: string;
      locationCode?: string;
    }[] = [];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const place of places) {
      if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
        items.push({ ...pick(place), action: "SKIP", reason: `Statut Google: ${place.businessStatus}` });
        skipped += 1;
        continue;
      }

      const existing = await prisma.location.findUnique({ where: { googlePlaceId: place.placeId } });

      if (existing) {
        updated += 1;
        items.push({ ...pick(place), action: "UPDATE", locationCode: existing.code });
        if (!dryRun) {
          await prisma.location.update({
            where: { id: existing.id },
            data: {
              latitude: place.latitude,
              longitude: place.longitude,
              address: place.formattedAddress,
              googleMapsUrl: buildGoogleMapsPlaceUrl(place.placeId),
            },
          });
        }
        continue;
      }

      const code = `KTA-GMB-${place.placeId.slice(-10)}`;
      created += 1;
      items.push({ ...pick(place), action: "CREATE", locationCode: code });

      if (!dryRun) {
        await prisma.location.create({
          data: {
            code,
            name: place.name,
            type: "STORE",
            city: guessCityFromAddress(place.formattedAddress),
            address: place.formattedAddress,
            latitude: place.latitude,
            longitude: place.longitude,
            googlePlaceId: place.placeId,
            googleMapsUrl: buildGoogleMapsPlaceUrl(place.placeId),
          },
        });
      }
    }

    return { query, dryRun, totalFound: places.length, created, updated, skipped, items };
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
        phone: coerceCellString(row.values.phone),
        website: coerceCellString(row.values.website),
        openingHoursText: coerceCellString(row.values.openingHoursText),
        googleMapsUrl: coerceCellString(row.values.googleMapsUrl),
        plusCode: coerceCellString(row.values.plusCode),
      };

      const parsed = importLocationRowSchema.safeParse(raw);
      if (!parsed.success) {
        result.errors.push({ row: row.rowNumber, message: parsed.error.issues[0]?.message ?? "Ligne invalide" });
        continue;
      }

      const data = {
        ...parsed.data,
        googleMapsUrl: parsed.data.googleMapsUrl || buildGoogleMapsSearchUrl(parsed.data),
      };
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

function pick(place: { placeId: string; name: string; formattedAddress: string }) {
  return { placeId: place.placeId, name: place.name, formattedAddress: place.formattedAddress };
}

// Heuristique best-effort : une adresse formatée Google ("183 Avenue
// Mohammed V, Guéliz, 40000 Marrakech, Maroc") place généralement la ville
// juste avant le pays. À vérifier/corriger manuellement après import.
function guessCityFromAddress(formattedAddress: string): string {
  const parts = formattedAddress.split(",").map((p) => p.trim());
  const withoutCountry = parts.filter((p) => !/maroc|morocco/i.test(p));
  const last = withoutCountry[withoutCountry.length - 1];
  if (!last) return "À vérifier";
  // Retire un éventuel code postal numérique en tête ("40000 Marrakech" -> "Marrakech").
  return last.replace(/^\d+\s*/, "") || "À vérifier";
}
