import { apiClient } from "./apiClient";
import { VehicleType } from "../types";

export type CreateVehicleTypePayload = Omit<VehicleType, "id" | "isActive">;

export const vehicleTypesService = {
  async list(): Promise<VehicleType[]> {
    const { data } = await apiClient.get<VehicleType[]>("/vehicle-types");
    return data;
  },

  async create(payload: CreateVehicleTypePayload): Promise<VehicleType> {
    const { data } = await apiClient.post<VehicleType>("/vehicle-types", payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateVehicleTypePayload>): Promise<VehicleType> {
    const { data } = await apiClient.patch<VehicleType>(`/vehicle-types/${id}`, payload);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/vehicle-types/${id}`);
  },
};
