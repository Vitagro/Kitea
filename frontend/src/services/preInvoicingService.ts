import { apiClient } from "./apiClient";
import { PreInvoice } from "../types";

export const preInvoicingService = {
  async list(status?: string): Promise<PreInvoice[]> {
    const { data } = await apiClient.get<PreInvoice[]>("/pre-invoices", { params: { status } });
    return data;
  },

  async generate(shipmentId: string, toleranceThresholdPercent = 5): Promise<PreInvoice> {
    const { data } = await apiClient.post<PreInvoice>("/pre-invoices/generate", {
      shipmentId,
      toleranceThresholdPercent,
    });
    return data;
  },

  async attachCarrierInvoice(
    preInvoiceId: string,
    payload: { invoiceNumber: string; carrierId: string; amount: number; currency?: string; invoiceDate: string }
  ): Promise<PreInvoice> {
    const { data } = await apiClient.post<PreInvoice>(`/pre-invoices/${preInvoiceId}/carrier-invoice`, payload);
    return data;
  },

  async resolve(
    id: string,
    payload: { decision: "APPROVED" | "REJECTED" | "CREDIT_NOTE_REQUESTED"; validatedBy: string; validationNote?: string }
  ): Promise<PreInvoice> {
    const { data } = await apiClient.post<PreInvoice>(`/pre-invoices/${id}/resolve`, payload);
    return data;
  },
};
