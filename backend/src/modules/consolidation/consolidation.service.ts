import { prisma } from "../../config/prisma";
import { distanceService } from "../distance/distance.service";
import { pricingService } from "../pricing/pricing.service";
import { calculateTheoreticalTransportCost } from "../pricing/pricing.calculator";
import {
  ConsolidatableOrder,
  ConsolidatedShipment,
  consolidateOrders,
  VehicleCapacity,
} from "./consolidation.algorithm";

export const consolidationService = {
  // Prévisualise la consolidation (aucune écriture en base) : utile pour
  // l'écran de simulation avant validation par le planificateur transport.
  async preview(): Promise<ConsolidatedShipment[]> {
    const { orders, fleet } = await this.loadPendingOrdersAndFleet();
    return consolidateOrders(orders, fleet);
  },

  // Exécute la consolidation et matérialise les shipments en base : crée les
  // Shipment, rattache les Order, calcule le coût théorique via le module
  // Pricing et passe les commandes au statut CONSOLIDATED.
  async run() {
    const { orders, fleet } = await this.loadPendingOrdersAndFleet();
    const shipments = consolidateOrders(orders, fleet);

    const created = [];
    for (const shipment of shipments) {
      created.push(await this.persistShipment(shipment));
    }
    return created;
  },

  async loadPendingOrdersAndFleet(): Promise<{
    orders: ConsolidatableOrder[];
    fleet: VehicleCapacity[];
  }> {
    const [pendingOrders, vehicleTypes] = await Promise.all([
      prisma.order.findMany({
        where: { status: "PENDING" },
        include: { destination: true },
      }),
      prisma.vehicleType.findMany({ where: { isActive: true } }),
    ]);

    const orders: ConsolidatableOrder[] = pendingOrders.map((order) => ({
      id: order.id,
      originLocationId: order.originLocationId,
      destinationLocationId: order.destinationLocationId,
      destinationZone: order.destination.city,
      volumeM3: order.volumeM3,
      weightKg: order.weightKg,
      isFragile: order.isFragile,
      isStackable: order.isStackable,
      deliveryWindowStart: order.deliveryWindowStart,
      deliveryWindowEnd: order.deliveryWindowEnd,
    }));

    const fleet: VehicleCapacity[] = vehicleTypes.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      maxVolumeM3: v.maxVolumeM3,
      maxWeightKg: v.maxWeightKg,
    }));

    return { orders, fleet };
  },

  async persistShipment(shipment: ConsolidatedShipment) {
    const distance = await distanceService.getOrCompute(
      shipment.originLocationId,
      shipment.destinationLocationId
    );

    const transportRule = await pricingService.resolveTransportRule({
      vehicleTypeId: shipment.vehicleType?.id,
      source: "INTERNAL",
    });

    const theoreticalCost = calculateTheoreticalTransportCost({
      rule: transportRule,
      distanceKm: distance.distanceKm,
    });

    const reference = `SHP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Heure d'arrivée planifiée = la deadline la plus contraignante parmi les
    // commandes consolidées (la plus proche `deliveryWindowEnd`) ; le départ
    // est retro-planifié à partir du temps de trajet estimé. Sans ces deux
    // valeurs, le suivi de ponctualité (PATCH /shipments/:id/delivery) ne
    // peut jamais calculer ON_TIME/LATE.
    const scheduledArrival = shipment.orders.reduce(
      (earliest, order) => (order.deliveryWindowEnd < earliest ? order.deliveryWindowEnd : earliest),
      shipment.orders[0].deliveryWindowEnd
    );
    const scheduledDeparture = new Date(scheduledArrival.getTime() - distance.durationMin * 60000);

    return prisma.shipment.create({
      data: {
        reference,
        originLocationId: shipment.originLocationId,
        destinationLocationId: shipment.destinationLocationId,
        vehicleTypeId: shipment.vehicleType?.id,
        totalVolumeM3: shipment.totalVolumeM3,
        totalWeightKg: shipment.totalWeightKg,
        fillRatePercent: shipment.fillRatePercent,
        theoreticalCost,
        scheduledDeparture,
        scheduledArrival,
        status: "PLANNED",
        orders: { connect: shipment.orders.map((o) => ({ id: o.id })) },
      },
      include: { orders: true, vehicleType: true },
    }).then(async (created) => {
      await prisma.order.updateMany({
        where: { id: { in: shipment.orders.map((o) => o.id) } },
        data: { status: "CONSOLIDATED", shipmentId: created.id },
      });
      return created;
    });
  },
};
