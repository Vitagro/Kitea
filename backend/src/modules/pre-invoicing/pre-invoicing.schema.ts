import { z } from "zod";

export const generatePreInvoiceSchema = z.object({
  body: z.object({
    shipmentId: z.string().uuid(),
    toleranceThresholdPercent: z.number().min(0).max(100).default(5),
  }),
});

export const attachCarrierInvoiceSchema = z.object({
  body: z.object({
    invoiceNumber: z.string().min(1),
    carrierId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().default("MAD"),
    invoiceDate: z.coerce.date(),
    documentUrl: z.string().url().optional(),
  }),
});

export const resolveDiscrepancySchema = z.object({
  body: z.object({
    decision: z.enum(["APPROVED", "REJECTED", "CREDIT_NOTE_REQUESTED"]),
    validatedBy: z.string().min(1),
    validationNote: z.string().optional(),
  }),
});

export type GeneratePreInvoiceInput = z.infer<typeof generatePreInvoiceSchema>["body"];
export type AttachCarrierInvoiceInput = z.infer<typeof attachCarrierInvoiceSchema>["body"];
export type ResolveDiscrepancyInput = z.infer<typeof resolveDiscrepancySchema>["body"];
