import { apiClient } from "./apiClient";
import { PreInvoice } from "../types";

export const preInvoicingService = {
  async list(status?: string): Promise<PreInvoice[]> {
    const { data } = await apiClient.get<PreInvoice[]>("/pre-invoices", { params: { status } });
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
