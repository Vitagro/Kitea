import { apiClient } from "../lib/apiClient";
import { VehicleType } from "../types";

export type CreateVehicleTypePayload = Omit<VehicleType, "id" | "isActive">;

export const vehicleTypesService = {
  list(): Promise<VehicleType[]> {
    return apiClient.get<VehicleType[]>("/vehicle-types");
  },

  create(payload: CreateVehicleTypePayload): Promise<VehicleType> {
    return apiClient.post<VehicleType>("/vehicle-types", payload);
  },

  update(id: string, payload: Partial<CreateVehicleTypePayload>): Promise<VehicleType> {
    return apiClient.patch<VehicleType>(`/vehicle-types/${id}`, payload);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete(`/vehicle-types/${id}`);
  },
};
