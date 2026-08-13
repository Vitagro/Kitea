export interface KpiOverview {
  totalShipments: number;
  deliveredCount: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRatePercent: number | null;
  totalTheoreticalCost: number;
  totalCarrierCost: number;
  avgGapPercent: number | null;
  currency: string;
}

export interface DriverRanking {
  employeeId: string;
  name: string;
  totalDeliveries: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRatePercent: number;
}

export interface StoreRanking {
  locationId: string;
  name: string;
  city: string;
  totalDeliveries: number;
  onTimeCount: number;
  onTimeRatePercent: number;
}

export interface WarehouseManagerRanking {
  employeeId: string;
  name: string;
  locationName: string;
  totalShipments: number;
  onTimeCount: number;
  onTimeRatePercent: number;
  avgCostGapPercent: number | null;
}

export interface TransportCostBreakdown {
  totalTheoreticalCost: number;
  shipmentCount: number;
  byVehicleType: { label: string; totalCost: number; shipmentCount: number }[];
  byCarrier: { label: string; totalCost: number; shipmentCount: number }[];
  currency: string;
}
