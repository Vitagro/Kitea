import { apiClient } from "../lib/apiClient";
import { ConsolidatedShipmentPreview } from "../types";

export const consolidationService = {
  preview(): Promise<ConsolidatedShipmentPreview[]> {
    return apiClient.get<ConsolidatedShipmentPreview[]>("/consolidation/preview");
  },

  run(): Promise<unknown[]> {
    return apiClient.post("/consolidation/run");
  },
};
