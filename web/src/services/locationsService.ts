import { apiClient, saveBlob } from "../lib/apiClient";
import { Location } from "../types";
import { ImportResult } from "../types/orders";

export type CreateLocationPayload = Omit<Location, "id" | "isActive">;

export interface GooglePlacesSyncResult {
  query: string;
  dryRun: boolean;
  totalFound: number;
  created: number;
  updated: number;
  skipped: number;
  items: {
    placeId: string;
    name: string;
    formattedAddress: string;
    action: "CREATE" | "UPDATE" | "SKIP";
    reason?: string;
    locationCode?: string;
  }[];
}

export const locationsService = {
  list(filters?: { type?: string; city?: string; includeInactive?: boolean }): Promise<Location[]> {
    return apiClient.get<Location[]>("/locations", filters);
  },

  getById(id: string): Promise<Location> {
    return apiClient.get<Location>(`/locations/${id}`);
  },

  create(payload: CreateLocationPayload): Promise<Location> {
    return apiClient.post<Location>("/locations", payload);
  },

  update(id: string, payload: Partial<CreateLocationPayload>): Promise<Location> {
    return apiClient.patch<Location>(`/locations/${id}`, payload);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete(`/locations/${id}`);
  },

  reactivate(id: string): Promise<Location> {
    return apiClient.post<Location>(`/locations/${id}/reactivate`);
  },

  geocode(id: string): Promise<Location> {
    return apiClient.post<Location>(`/locations/${id}/geocode`);
  },

  // Découverte automatique du réseau KITEA depuis Google Maps (Places API).
  // dryRun=true (défaut) simule sans écrire — à confirmer avec dryRun=false.
  syncGooglePlaces(query?: string, dryRun = true): Promise<GooglePlacesSyncResult> {
    return apiClient.post<GooglePlacesSyncResult>("/locations/sync-google-places", { query, dryRun });
  },

  async exportExcel(): Promise<void> {
    const blob = await apiClient.downloadBlob("/locations/export");
    saveBlob(blob, "sites-kitea.xlsx");
  },

  async downloadTemplate(): Promise<void> {
    const blob = await apiClient.downloadBlob("/locations/import/template");
    saveBlob(blob, "modele-import-sites.xlsx");
  },

  importExcel(file: File): Promise<ImportResult> {
    return apiClient.upload<ImportResult>("/locations/import", file);
  },
};
