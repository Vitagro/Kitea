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

// Item d'un lot importé en masse (JSON) : mêmes champs que le webhook
// unitaire, sans eventType (implicite pour tout le lot importé).
export const bulkOrderItemSchema = z.object({
  erpSourceRef: z.string().min(1),
  reference: z.string().min(1),
  originCode: z.string().min(1),
  destinationCode: z.string().min(1),
  volumeM3: z.number().positive(),
  weightKg: z.number().positive(),
  deliveryWindowStart: z.coerce.date(),
  deliveryWindowEnd: z.coerce.date(),
});

export const importOrdersBatchSchema = z.object({
  body: z.object({
    orders: z.array(bulkOrderItemSchema).min(1, "Le lot doit contenir au moins une commande"),
  }),
});

export type BulkOrderItem = z.infer<typeof bulkOrderItemSchema>;

// Ligne d'import Excel côté ERP : mêmes champs que le lot JSON (référence
// ERP obligatoire pour la traçabilité du flux, journalisée dans ErpSyncLog).
export const erpImportOrderRowSchema = bulkOrderItemSchema.refine(
  (data) => data.deliveryWindowStart <= data.deliveryWindowEnd,
  { message: "La fenêtre de livraison est invalide (début après fin)", path: ["deliveryWindowEnd"] }
);

export interface ErpImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
