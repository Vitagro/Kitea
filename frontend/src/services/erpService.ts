import { apiClient } from "./apiClient";
import { downloadBlob } from "./downloadFile";
import { ImportResult } from "../types/orders";

export interface ErpSyncLog {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  eventType: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  errorMessage?: string | null;
  createdAt: string;
}

export const erpService = {
  async importOrdersFromExcel(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<ImportResult>("/erp/import/orders/excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async downloadImportTemplate(): Promise<void> {
    const { data } = await apiClient.get("/erp/import/orders/template", { responseType: "blob" });
    downloadBlob(data, "modele-import-commandes-erp.xlsx");
  },

  async listSyncLogs(direction?: "INBOUND" | "OUTBOUND"): Promise<ErpSyncLog[]> {
    const { data } = await apiClient.get<ErpSyncLog[]>("/erp/sync-logs", { params: { direction } });
    return data;
  },
};
