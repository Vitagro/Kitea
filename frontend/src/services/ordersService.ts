import { apiClient } from "./apiClient";
import { downloadBlob } from "./downloadFile";
import { ImportResult, Order, OrderStatus } from "../types/orders";

export const ordersService = {
  async list(status?: OrderStatus): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>("/orders", { params: { status } });
    return data;
  },

  async exportExcel(status?: OrderStatus): Promise<void> {
    const { data } = await apiClient.get("/orders/export", { params: { status }, responseType: "blob" });
    downloadBlob(data, "commandes-kitea.xlsx");
  },

  async downloadTemplate(): Promise<void> {
    const { data } = await apiClient.get("/orders/import/template", { responseType: "blob" });
    downloadBlob(data, "modele-import-commandes.xlsx");
  },

  async importExcel(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<ImportResult>("/orders/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
