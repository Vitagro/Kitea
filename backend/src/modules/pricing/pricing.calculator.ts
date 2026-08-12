import { PricingRule } from "@prisma/client";

export interface TransportCostInput {
  rule: PricingRule | null;
  distanceKm: number;
}

// Calcule le coût théorique de transport à partir de la règle tarifaire résolue.
// TRANSPORT_PER_KM      -> unitPrice * distanceKm
// TRANSPORT_FLAT_ZONE   -> unitPrice (forfait, indépendant de la distance)
// TRANSPORT_PER_VEHICLE -> unitPrice (forfait par véhicule affecté)
export function calculateTheoreticalTransportCost({ rule, distanceKm }: TransportCostInput): number {
  if (!rule) return 0;

  switch (rule.ruleType) {
    case "TRANSPORT_PER_KM":
      return round2(rule.unitPrice * distanceKm);
    case "TRANSPORT_FLAT_ZONE":
    case "TRANSPORT_PER_VEHICLE":
      return round2(rule.unitPrice);
    default:
      return 0;
  }
}

export interface StorageCostInput {
  rule: PricingRule | null;
  storageAreaM2?: number;
  palletCount?: number;
  daysStored: number;
}

// STORAGE_PER_M2_MONTH    -> unitPrice * m² * (jours / 30)
// STORAGE_PER_PALLET_DAY  -> unitPrice * nb palettes * jours
export function calculateTheoreticalStorageCost({
  rule,
  storageAreaM2,
  palletCount,
  daysStored,
}: StorageCostInput): number {
  if (!rule) return 0;

  if (rule.ruleType === "STORAGE_PER_M2_MONTH" && storageAreaM2) {
    return round2(rule.unitPrice * storageAreaM2 * (daysStored / 30));
  }
  if (rule.ruleType === "STORAGE_PER_PALLET_DAY" && palletCount) {
    return round2(rule.unitPrice * palletCount * daysStored);
  }
  return 0;
}

export function calculateHandlingCost(rule: PricingRule | null, unitCount: number): number {
  if (!rule) return 0;
  return round2(rule.unitPrice * unitCount);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
