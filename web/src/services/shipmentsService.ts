import { apiClient } from "../lib/apiClient";
import { Shipment } from "../types";

export interface RecordDeliveryPayload {
  driverId?: string;
  actualDeparture?: string;
  actualArrival?: string;
}

export const shipmentsService = {
  list(status?: string): Promise<Shipment[]> {
    return apiClient.get<Shipment[]>("/shipments", { status });
  },

  getById(id: string): Promise<Shipment> {
    return apiClient.get<Shipment>(`/shipments/${id}`);
  },

  recordDelivery(id: string, payload: RecordDeliveryPayload): Promise<Shipment> {
    return apiClient.patch<Shipment>(`/shipments/${id}/delivery`, payload);
  },
};
