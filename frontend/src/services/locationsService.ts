import { apiClient } from "./apiClient";
import { Location } from "../types";

export const locationsService = {
  async list(filters?: { type?: string; city?: string }): Promise<Location[]> {
    const { data } = await apiClient.get<Location[]>("/locations", { params: filters });
    return data;
  },

  async getById(id: string): Promise<Location> {
    const { data } = await apiClient.get<Location>(`/locations/${id}`);
    return data;
  },
};
