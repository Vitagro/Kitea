import { apiClient, saveBlob } from "../lib/apiClient";
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
  importOrdersFromExcel(file: File): Promise<ImportResult> {
    return apiClient.upload<ImportResult>("/erp/import/orders/excel", file);
  },

  async downloadImportTemplate(): Promise<void> {
    const blob = await apiClient.downloadBlob("/erp/import/orders/template");
    saveBlob(blob, "modele-import-commandes-erp.xlsx");
  },

  listSyncLogs(direction?: "INBOUND" | "OUTBOUND"): Promise<ErpSyncLog[]> {
    return apiClient.get<ErpSyncLog[]>("/erp/sync-logs", { direction });
  },
};
