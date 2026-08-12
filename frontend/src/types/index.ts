export type LocationType = "STORE" | "WAREHOUSE" | "HUB_3PL" | "CROSS_DOCK";

export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  address?: string | null;
  city: string;
  region?: string | null;
  country: string;
  storageAreaM2?: number | null;
  storageVolumeM3?: number | null;
  bufferStockUnits?: number | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  truckAccessRestriction?: string | null;
  operatingDays?: string | null;
  operatorName?: string | null;
  isActive: boolean;
}

export type PricingRuleType =
  | "TRANSPORT_FLAT_ZONE"
  | "TRANSPORT_PER_KM"
  | "TRANSPORT_PER_VEHICLE"
  | "STORAGE_PER_PALLET_DAY"
  | "STORAGE_PER_M2_MONTH"
  | "HANDLING_IN"
  | "HANDLING_OUT";

export type PricingSource = "INTERNAL" | "EXTERNAL_3PL";

export interface PricingRule {
  id: string;
  label: string;
  ruleType: PricingRuleType;
  source: PricingSource;
  carrierId?: string | null;
  vehicleTypeId?: string | null;
  storageLocationId?: string | null;
  zoneName?: string | null;
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo?: string | null;
  isActive: boolean;
}

export interface VehicleType {
  id: string;
  code: string;
  name: string;
  maxVolumeM3: number;
  maxWeightKg: number;
}

export type MatchingStatus =
  | "PENDING_INVOICE"
  | "MATCHED"
  | "DISCREPANCY"
  | "APPROVED"
  | "REJECTED"
  | "CREDIT_NOTE_REQUESTED";

export interface PreInvoice {
  id: string;
  reference: string;
  shipmentId: string;
  theoreticalAmount: number;
  carrierAmount?: number | null;
  gapAmount?: number | null;
  gapPercent?: number | null;
  toleranceThresholdPercent: number;
  currency: string;
  matchingStatus: MatchingStatus;
}

export interface ConsolidatedShipmentPreview {
  orders: { id: string; volumeM3: number; weightKg: number }[];
  vehicleType: VehicleType | null;
  totalVolumeM3: number;
  totalWeightKg: number;
  fillRatePercent: number;
  originLocationId: string;
  destinationLocationId: string;
}
