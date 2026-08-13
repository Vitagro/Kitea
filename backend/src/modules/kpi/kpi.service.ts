import { Employee, Location } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface KpiPeriod {
  from?: Date;
  to?: Date;
}

// Toutes les requêtes de ce module agrègent en mémoire (JS) plutôt qu'en SQL
// pur : plus simple à lire/maintenir pour un premier jet ("code de base"),
// et largement suffisant au volume d'un control tower (quelques milliers
// d'expéditions). Au-delà, remplacer par des vues matérialisées Postgres ou
// un job d'agrégation planifié (cf. README).

export const kpiService = {
  // Vue d'ensemble : volumétrie, ponctualité, coûts de transport.
  async getOverview(period: KpiPeriod = {}) {
    const shipments = await prisma.shipment.findMany({
      where: dateRangeWhere(period, "createdAt"),
      include: { preInvoice: true },
    });

    const delivered = shipments.filter((s) => s.deliveryPerformance !== null);
    const onTime = delivered.filter((s) => s.deliveryPerformance === "ON_TIME");
    const late = delivered.filter((s) => s.deliveryPerformance === "LATE");

    const invoicesWithCarrierAmount = shipments
      .map((s) => s.preInvoice)
      .filter((pi): pi is NonNullable<typeof pi> => !!pi && pi.carrierAmount != null);

    return {
      period,
      totalShipments: shipments.length,
      deliveredCount: delivered.length,
      onTimeCount: onTime.length,
      lateCount: late.length,
      onTimeRatePercent: delivered.length ? round2((onTime.length / delivered.length) * 100) : null,
      totalTheoreticalCost: round2(sum(shipments.map((s) => s.theoreticalCost ?? 0))),
      totalCarrierCost: round2(sum(invoicesWithCarrierAmount.map((pi) => pi.carrierAmount ?? 0))),
      avgGapPercent: invoicesWithCarrierAmount.length
        ? round2(sum(invoicesWithCarrierAmount.map((pi) => pi.gapPercent ?? 0)) / invoicesWithCarrierAmount.length)
        : null,
      currency: "MAD",
    };
  },

  // Classement des livreurs par taux de ponctualité sur les livraisons
  // réalisées (deliveryPerformance renseigné via PATCH /shipments/:id/delivery).
  async getDriverRankings(period: KpiPeriod = {}) {
    const shipments = await prisma.shipment.findMany({
      where: { driverId: { not: null }, deliveryPerformance: { not: null }, ...dateRangeWhere(period, "actualArrival") },
      include: { driver: true },
    });

    const byDriver = new Map<string, { driver: Employee; total: number; onTime: number }>();
    for (const shipment of shipments) {
      if (!shipment.driver || !shipment.driverId) continue;
      const entry = byDriver.get(shipment.driverId) ?? { driver: shipment.driver, total: 0, onTime: 0 };
      entry.total += 1;
      if (shipment.deliveryPerformance === "ON_TIME") entry.onTime += 1;
      byDriver.set(shipment.driverId, entry);
    }

    return Array.from(byDriver.values())
      .map(({ driver, total, onTime }) => ({
        employeeId: driver.id,
        name: `${driver.firstName} ${driver.lastName}`,
        totalDeliveries: total,
        onTimeCount: onTime,
        lateCount: total - onTime,
        onTimeRatePercent: round2((onTime / total) * 100),
      }))
      .sort((a, b) => b.onTimeRatePercent - a.onTimeRatePercent || b.totalDeliveries - a.totalDeliveries);
  },

  // Classement des magasins par taux de ponctualité des livraisons reçues —
  // un proxy de la fiabilité de la desserte de chaque point de vente.
  async getStoreRankings(period: KpiPeriod = {}) {
    const shipments = await prisma.shipment.findMany({
      where: {
        deliveryPerformance: { not: null },
        destination: { type: "STORE" },
        ...dateRangeWhere(period, "actualArrival"),
      },
      include: { destination: true },
    });

    const byStore = new Map<string, { location: Location; total: number; onTime: number }>();
    for (const shipment of shipments) {
      const entry = byStore.get(shipment.destinationLocationId) ?? {
        location: shipment.destination,
        total: 0,
        onTime: 0,
      };
      entry.total += 1;
      if (shipment.deliveryPerformance === "ON_TIME") entry.onTime += 1;
      byStore.set(shipment.destinationLocationId, entry);
    }

    return Array.from(byStore.values())
      .map(({ location, total, onTime }) => ({
        locationId: location.id,
        name: location.name,
        city: location.city,
        totalDeliveries: total,
        onTimeCount: onTime,
        onTimeRatePercent: round2((onTime / total) * 100),
      }))
      .sort((a, b) => b.onTimeRatePercent - a.onTimeRatePercent || b.totalDeliveries - a.totalDeliveries);
  },

  // Classement des responsables de dépôt (Employee role=WAREHOUSE_MANAGER) :
  // ponctualité des expéditions parties de leur site + écart de coût moyen
  // (pré-facture vs facture prestataire) sur ces mêmes expéditions.
  async getWarehouseManagerRankings(period: KpiPeriod = {}) {
    const managers = await prisma.employee.findMany({
      where: { role: "WAREHOUSE_MANAGER", isActive: true, locationId: { not: null } },
      include: { location: true },
    });

    const rankings = [];
    for (const manager of managers) {
      if (!manager.locationId) continue;

      const shipments = await prisma.shipment.findMany({
        where: {
          originLocationId: manager.locationId,
          deliveryPerformance: { not: null },
          ...dateRangeWhere(period, "actualArrival"),
        },
        include: { preInvoice: true },
      });
      if (shipments.length === 0) continue;

      const onTime = shipments.filter((s) => s.deliveryPerformance === "ON_TIME").length;
      const gaps = shipments
        .map((s) => s.preInvoice?.gapPercent)
        .filter((gap): gap is number => gap != null);

      rankings.push({
        employeeId: manager.id,
        name: `${manager.firstName} ${manager.lastName}`,
        locationName: manager.location?.name ?? "—",
        totalShipments: shipments.length,
        onTimeCount: onTime,
        onTimeRatePercent: round2((onTime / shipments.length) * 100),
        avgCostGapPercent: gaps.length ? round2(sum(gaps) / gaps.length) : null,
      });
    }

    return rankings.sort((a, b) => b.onTimeRatePercent - a.onTimeRatePercent || b.totalShipments - a.totalShipments);
  },

  // Ventilation des coûts de transport théoriques par type de véhicule et
  // par transporteur — support direct des "indicateurs sur les coûts de
  // transport" demandés.
  async getTransportCostBreakdown(period: KpiPeriod = {}) {
    const shipments = await prisma.shipment.findMany({
      where: { theoreticalCost: { not: null }, ...dateRangeWhere(period, "createdAt") },
      include: { vehicleType: true, carrier: true },
    });

    return {
      totalTheoreticalCost: round2(sum(shipments.map((s) => s.theoreticalCost ?? 0))),
      shipmentCount: shipments.length,
      byVehicleType: groupCostBy(shipments, (s) => s.vehicleType?.name ?? "Non affecté"),
      byCarrier: groupCostBy(shipments, (s) => s.carrier?.name ?? "Non affecté"),
      currency: "MAD",
    };
  },
};

function dateRangeWhere(period: KpiPeriod, field: "createdAt" | "actualArrival") {
  if (!period.from && !period.to) return {};
  return { [field]: { gte: period.from, lte: period.to } };
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupCostBy<T extends { theoreticalCost: number | null }>(
  items: T[],
  keyFn: (item: T) => string
): { label: string; totalCost: number; shipmentCount: number }[] {
  const groups = new Map<string, { totalCost: number; shipmentCount: number }>();
  for (const item of items) {
    const key = keyFn(item);
    const entry = groups.get(key) ?? { totalCost: 0, shipmentCount: 0 };
    entry.totalCost += item.theoreticalCost ?? 0;
    entry.shipmentCount += 1;
    groups.set(key, entry);
  }
  return Array.from(groups.entries())
    .map(([label, { totalCost, shipmentCount }]) => ({ label, totalCost: round2(totalCost), shipmentCount }))
    .sort((a, b) => b.totalCost - a.totalCost);
}
