import { apiClient, saveBlob } from "../lib/apiClient";
import { ImportResult, Order, OrderStatus } from "../types/orders";

export const ordersService = {
  list(status?: OrderStatus): Promise<Order[]> {
    return apiClient.get<Order[]>("/orders", { status });
  },

  async exportExcel(status?: OrderStatus): Promise<void> {
    const blob = await apiClient.downloadBlob("/orders/export", { status });
    saveBlob(blob, "commandes-kitea.xlsx");
  },

  async downloadTemplate(): Promise<void> {
    const blob = await apiClient.downloadBlob("/orders/import/template");
    saveBlob(blob, "modele-import-commandes.xlsx");
  },

  importExcel(file: File): Promise<ImportResult> {
    return apiClient.upload<ImportResult>("/orders/import", file);
  },
};
