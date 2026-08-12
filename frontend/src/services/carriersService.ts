import { apiClient } from "./apiClient";
import { Carrier } from "../types";

export type CreateCarrierPayload = Omit<Carrier, "id" | "isActive">;

export const carriersService = {
  async list(): Promise<Carrier[]> {
    const { data } = await apiClient.get<Carrier[]>("/carriers");
    return data;
  },

  async create(payload: CreateCarrierPayload): Promise<Carrier> {
    const { data } = await apiClient.post<Carrier>("/carriers", payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateCarrierPayload>): Promise<Carrier> {
    const { data } = await apiClient.patch<Carrier>(`/carriers/${id}`, payload);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/carriers/${id}`);
  },
};
