import { z } from "zod";

export const locationTypeEnum = z.enum(["STORE", "WAREHOUSE", "HUB_3PL", "CROSS_DOCK"]);

export const createLocationSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    type: locationTypeEnum,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
    city: z.string().min(1),
    region: z.string().optional(),
    country: z.string().default("MA"),
    storageAreaM2: z.number().nonnegative().optional(),
    storageVolumeM3: z.number().nonnegative().optional(),
    bufferStockUnits: z.number().int().nonnegative().optional(),
    deliveryWindowStart: z.string().optional(),
    deliveryWindowEnd: z.string().optional(),
    truckAccessRestriction: z.string().optional(),
    operatingDays: z.string().optional(),
    operatorName: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    openingHoursText: z.string().optional(),
    googleMapsUrl: z.string().optional(),
    googlePlaceId: z.string().optional(),
    plusCode: z.string().optional(),
  }),
});

export const updateLocationSchema = z.object({
  body: createLocationSchema.shape.body.partial().extend({ isActive: z.boolean().optional() }),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>["body"];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>["body"];

// Ligne d'import Excel après coercion des cellules brutes.
export const importLocationRowSchema = z.object({
  code: z.string().min(1, "Code requis"),
  name: z.string().min(1, "Nom requis"),
  type: locationTypeEnum,
  city: z.string().min(1, "Ville requise"),
  region: z.string().optional(),
  country: z.string().default("MA"),
  address: z.string().optional(),
  latitude: z.number({ invalid_type_error: "Latitude invalide" }).min(-90).max(90),
  longitude: z.number({ invalid_type_error: "Longitude invalide" }).min(-180).max(180),
  storageAreaM2: z.number().nonnegative().optional(),
  storageVolumeM3: z.number().nonnegative().optional(),
  bufferStockUnits: z.number().int().nonnegative().optional(),
  deliveryWindowStart: z.string().optional(),
  deliveryWindowEnd: z.string().optional(),
  truckAccessRestriction: z.string().optional(),
  operatingDays: z.string().optional(),
  operatorName: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHoursText: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  plusCode: z.string().optional(),
});

export type ImportLocationRow = z.infer<typeof importLocationRowSchema>;

export interface ImportLocationsResult {
  totalRows: number;
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}
