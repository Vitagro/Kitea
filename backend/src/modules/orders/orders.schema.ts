import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    reference: z.string().min(1),
    originLocationId: z.string().uuid(),
    destinationLocationId: z.string().uuid(),
    volumeM3: z.number().positive(),
    weightKg: z.number().positive(),
    isFragile: z.boolean().default(false),
    isStackable: z.boolean().default(true),
    deliveryWindowStart: z.coerce.date(),
    deliveryWindowEnd: z.coerce.date(),
    erpSourceRef: z.string().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];
