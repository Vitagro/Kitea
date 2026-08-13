import { apiClient } from "../lib/apiClient";
import {
  DriverRanking,
  KpiOverview,
  StoreRanking,
  TransportCostBreakdown,
  WarehouseManagerRanking,
} from "../types/kpi";

export interface KpiPeriodFilter {
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export const kpiService = {
  getOverview(period?: KpiPeriodFilter): Promise<KpiOverview> {
    return apiClient.get<KpiOverview>("/kpi/overview", period);
  },

  getDriverRankings(period?: KpiPeriodFilter): Promise<DriverRanking[]> {
    return apiClient.get<DriverRanking[]>("/kpi/rankings/drivers", period);
  },

  getStoreRankings(period?: KpiPeriodFilter): Promise<StoreRanking[]> {
    return apiClient.get<StoreRanking[]>("/kpi/rankings/stores", period);
  },

  getWarehouseManagerRankings(period?: KpiPeriodFilter): Promise<WarehouseManagerRanking[]> {
    return apiClient.get<WarehouseManagerRanking[]>("/kpi/rankings/warehouse-managers", period);
  },

  getTransportCosts(period?: KpiPeriodFilter): Promise<TransportCostBreakdown> {
    return apiClient.get<TransportCostBreakdown>("/kpi/transport-costs", period);
  },
};
