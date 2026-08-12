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
  }),
});

export const updateLocationSchema = z.object({
  body: createLocationSchema.shape.body.partial(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>["body"];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>["body"];
