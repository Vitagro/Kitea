import { apiClient } from "./apiClient";
import { ConsolidatedShipmentPreview } from "../types";

export const consolidationService = {
  async preview(): Promise<ConsolidatedShipmentPreview[]> {
    const { data } = await apiClient.get<ConsolidatedShipmentPreview[]>("/consolidation/preview");
    return data;
  },

  async run(): Promise<unknown[]> {
    const { data } = await apiClient.post("/consolidation/run");
    return data;
  },
};
