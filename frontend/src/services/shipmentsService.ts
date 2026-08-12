import { apiClient } from "./apiClient";
import { Shipment } from "../types";

export const shipmentsService = {
  async list(status?: string): Promise<Shipment[]> {
    const { data } = await apiClient.get<Shipment[]>("/shipments", { params: { status } });
    return data;
  },
};
