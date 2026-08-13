import { apiClient } from "../lib/apiClient";
import { PreInvoice } from "../types";

export const preInvoicingService = {
  list(status?: string): Promise<PreInvoice[]> {
    return apiClient.get<PreInvoice[]>("/pre-invoices", { status });
  },

  generate(shipmentId: string, toleranceThresholdPercent = 5): Promise<PreInvoice> {
    return apiClient.post<PreInvoice>("/pre-invoices/generate", { shipmentId, toleranceThresholdPercent });
  },

  attachCarrierInvoice(
    preInvoiceId: string,
    payload: { invoiceNumber: string; carrierId: string; amount: number; currency?: string; invoiceDate: string }
  ): Promise<PreInvoice> {
    return apiClient.post<PreInvoice>(`/pre-invoices/${preInvoiceId}/carrier-invoice`, payload);
  },

  resolve(
    id: string,
    payload: { decision: "APPROVED" | "REJECTED" | "CREDIT_NOTE_REQUESTED"; validatedBy: string; validationNote?: string }
  ): Promise<PreInvoice> {
    return apiClient.post<PreInvoice>(`/pre-invoices/${id}/resolve`, payload);
  },
};
