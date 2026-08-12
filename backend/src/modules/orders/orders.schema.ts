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

// Ligne d'import (Excel ou lot ERP) après coercion des cellules brutes :
// les sites sont référencés par leur `code` lisible, résolu en ID plus tard.
// Exportée sans le .refine() pour permettre son extension (voir
// erp-integration.schema.ts qui impose erpSourceRef).
export const importOrderRowBaseSchema = z.object({
  reference: z.string().min(1, "Référence requise"),
  originCode: z.string().min(1, "Code site origine requis"),
  destinationCode: z.string().min(1, "Code site destination requis"),
  volumeM3: z.number({ invalid_type_error: "Volume invalide" }).positive("Volume doit être positif"),
  weightKg: z.number({ invalid_type_error: "Poids invalide" }).positive("Poids doit être positif"),
  isFragile: z.boolean().default(false),
  isStackable: z.boolean().default(true),
  deliveryWindowStart: z.date({ invalid_type_error: "Date de début de livraison invalide" }),
  deliveryWindowEnd: z.date({ invalid_type_error: "Date de fin de livraison invalide" }),
  erpSourceRef: z.string().optional(),
});

function withDeliveryWindowCheck<T extends typeof importOrderRowBaseSchema>(schema: T) {
  return schema.refine(
    (data: z.infer<T>) => data.deliveryWindowStart <= data.deliveryWindowEnd,
    { message: "La fenêtre de livraison est invalide (début après fin)", path: ["deliveryWindowEnd"] }
  );
}

export const importOrderRowSchema = withDeliveryWindowCheck(importOrderRowBaseSchema);

export type ImportOrderRow = z.infer<typeof importOrderRowSchema>;

export interface ImportOrdersResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
