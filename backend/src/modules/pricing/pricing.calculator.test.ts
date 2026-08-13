import { PricingRule } from "@prisma/client";
import {
  calculateHandlingCost,
  calculateTheoreticalStorageCost,
  calculateTheoreticalTransportCost,
} from "./pricing.calculator";

function makeRule(overrides: Partial<PricingRule>): PricingRule {
  return {
    id: "rule-1",
    label: "Test rule",
    ruleType: "TRANSPORT_PER_KM",
    source: "INTERNAL",
    carrierId: null,
    vehicleTypeId: null,
    storageLocationId: null,
    zoneName: null,
    unitPrice: 1,
    currency: "MAD",
    validFrom: new Date("2026-01-01"),
    validTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PricingRule;
}

describe("calculateTheoreticalTransportCost", () => {
  it("returns 0 when no rule was resolved", () => {
    expect(calculateTheoreticalTransportCost({ rule: null, distanceKm: 50 })).toBe(0);
  });

  it("multiplies unit price by distance for TRANSPORT_PER_KM", () => {
    const rule = makeRule({ ruleType: "TRANSPORT_PER_KM", unitPrice: 3.5 });
    expect(calculateTheoreticalTransportCost({ rule, distanceKm: 20 })).toBe(70);
  });

  it("is a flat fee independent of distance for TRANSPORT_FLAT_ZONE", () => {
    const rule = makeRule({ ruleType: "TRANSPORT_FLAT_ZONE", unitPrice: 250 });
    expect(calculateTheoreticalTransportCost({ rule, distanceKm: 500 })).toBe(250);
    expect(calculateTheoreticalTransportCost({ rule, distanceKm: 1 })).toBe(250);
  });

  it("is a flat fee for TRANSPORT_PER_VEHICLE too", () => {
    const rule = makeRule({ ruleType: "TRANSPORT_PER_VEHICLE", unitPrice: 800 });
    expect(calculateTheoreticalTransportCost({ rule, distanceKm: 999 })).toBe(800);
  });

  it("returns 0 for a rule type that doesn't apply to transport (e.g. storage)", () => {
    const rule = makeRule({ ruleType: "STORAGE_PER_M2_MONTH", unitPrice: 40 });
    expect(calculateTheoreticalTransportCost({ rule, distanceKm: 20 })).toBe(0);
  });
});

describe("calculateTheoreticalStorageCost", () => {
  it("returns 0 when no rule was resolved", () => {
    expect(calculateTheoreticalStorageCost({ rule: null, daysStored: 10 })).toBe(0);
  });

  it("prorates m2/month pricing by days stored", () => {
    const rule = makeRule({ ruleType: "STORAGE_PER_M2_MONTH", unitPrice: 30 });
    // 30 MAD/m2/month * 100 m2 * (15/30) = 1500
    expect(calculateTheoreticalStorageCost({ rule, storageAreaM2: 100, daysStored: 15 })).toBe(1500);
  });

  it("multiplies pallet/day pricing by pallet count and days", () => {
    const rule = makeRule({ ruleType: "STORAGE_PER_PALLET_DAY", unitPrice: 5 });
    expect(calculateTheoreticalStorageCost({ rule, palletCount: 20, daysStored: 10 })).toBe(1000);
  });

  it("returns 0 when the required dimension for the rule type is missing", () => {
    const rule = makeRule({ ruleType: "STORAGE_PER_M2_MONTH", unitPrice: 30 });
    expect(calculateTheoreticalStorageCost({ rule, daysStored: 15 })).toBe(0);
  });
});

describe("calculateHandlingCost", () => {
  it("returns 0 when no rule was resolved", () => {
    expect(calculateHandlingCost(null, 50)).toBe(0);
  });

  it("multiplies unit price by unit count", () => {
    const rule = makeRule({ ruleType: "HANDLING_IN", unitPrice: 2.5 });
    expect(calculateHandlingCost(rule, 40)).toBe(100);
  });
});
