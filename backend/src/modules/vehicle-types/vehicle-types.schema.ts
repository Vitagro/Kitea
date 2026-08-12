import { z } from "zod";

export const createVehicleTypeSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    maxVolumeM3: z.number().positive(),
    maxWeightKg: z.number().positive(),
    lengthCm: z.number().positive().optional(),
    widthCm: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
  }),
});

export const updateVehicleTypeSchema = z.object({
  body: createVehicleTypeSchema.shape.body.partial(),
});

export type CreateVehicleTypeInput = z.infer<typeof createVehicleTypeSchema>["body"];
export type UpdateVehicleTypeInput = z.infer<typeof updateVehicleTypeSchema>["body"];
