import { z } from "zod";

// Flux inbound : commandes d'achat, réassorts magasins, transferts inter-dépôts.
export const inboundOrderWebhookSchema = z.object({
  body: z.object({
    eventType: z.literal("ORDER_CREATED"),
    erpSourceRef: z.string().min(1),
    reference: z.string().min(1),
    originCode: z.string().min(1), // code Location origine (ERP)
    destinationCode: z.string().min(1), // code Location destination (ERP)
    volumeM3: z.number().positive(),
    weightKg: z.number().positive(),
    deliveryWindowStart: z.coerce.date(),
    deliveryWindowEnd: z.coerce.date(),
  }),
});

export type InboundOrderWebhookInput = z.infer<typeof inboundOrderWebhookSchema>["body"];
