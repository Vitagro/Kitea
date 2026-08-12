import { z } from "zod";

export const createCarrierSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    isInternal: z.boolean().default(false),
    contactEmail: z.string().email().optional(),
  }),
});

export const updateCarrierSchema = z.object({
  body: createCarrierSchema.shape.body.partial(),
});

export type CreateCarrierInput = z.infer<typeof createCarrierSchema>["body"];
export type UpdateCarrierInput = z.infer<typeof updateCarrierSchema>["body"];
