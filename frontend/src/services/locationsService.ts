import { apiClient } from "./apiClient";
import { downloadBlob } from "./downloadFile";
import { Location } from "../types";
import { ImportResult } from "../types/orders";

export type CreateLocationPayload = Omit<Location, "id" | "isActive">;

export const locationsService = {
  async list(filters?: { type?: string; city?: string; includeInactive?: boolean }): Promise<Location[]> {
    const { data } = await apiClient.get<Location[]>("/locations", { params: filters });
    return data;
  },

  async getById(id: string): Promise<Location> {
    const { data } = await apiClient.get<Location>(`/locations/${id}`);
    return data;
  },

  async create(payload: CreateLocationPayload): Promise<Location> {
    const { data } = await apiClient.post<Location>("/locations", payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateLocationPayload>): Promise<Location> {
    const { data } = await apiClient.patch<Location>(`/locations/${id}`, payload);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/locations/${id}`);
  },

  async reactivate(id: string): Promise<Location> {
    const { data } = await apiClient.post<Location>(`/locations/${id}/reactivate`);
    return data;
  },

  async geocode(id: string): Promise<Location> {
    const { data } = await apiClient.post<Location>(`/locations/${id}/geocode`);
    return data;
  },

  async exportExcel(): Promise<void> {
    const { data } = await apiClient.get("/locations/export", { responseType: "blob" });
    downloadBlob(data, "sites-kitea.xlsx");
  },

  async downloadTemplate(): Promise<void> {
    const { data } = await apiClient.get("/locations/import/template", { responseType: "blob" });
    downloadBlob(data, "modele-import-sites.xlsx");
  },

  async importExcel(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<ImportResult>("/locations/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
