import { apiClient } from "../lib/apiClient";
import { Carrier } from "../types";

export type CreateCarrierPayload = Omit<Carrier, "id" | "isActive">;

export const carriersService = {
  list(): Promise<Carrier[]> {
    return apiClient.get<Carrier[]>("/carriers");
  },

  create(payload: CreateCarrierPayload): Promise<Carrier> {
    return apiClient.post<Carrier>("/carriers", payload);
  },

  update(id: string, payload: Partial<CreateCarrierPayload>): Promise<Carrier> {
    return apiClient.patch<Carrier>(`/carriers/${id}`, payload);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete(`/carriers/${id}`);
  },
};
