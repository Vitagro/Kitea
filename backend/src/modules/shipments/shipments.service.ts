import { ShipmentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { RecordDeliveryInput } from "./shipments.schema";

const SHIPMENT_INCLUDE = {
  origin: true,
  destination: true,
  vehicleType: true,
  carrier: true,
  driver: true,
  orders: true,
  preInvoice: true,
} as const;

// Tolérance avant qu'une livraison arrivée après l'heure planifiée soit
// comptée "en retard" (évite de pénaliser des écarts de quelques minutes).
const DELIVERY_GRACE_PERIOD_MIN = 15;

export const shipmentsService = {
  list(status?: ShipmentStatus) {
    return prisma.shipment.findMany({
      where: { status },
      include: SHIPMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const shipment = await prisma.shipment.findUnique({ where: { id }, include: SHIPMENT_INCLUDE });
    if (!shipment) throw AppError.notFound("Shipment");
    return shipment;
  },

  // Enregistre le suivi réel d'une expédition : affectation du chauffeur et
  // horodatage départ/arrivée. Dès que `actualArrival` est renseigné et
  // qu'une heure planifiée existe, la performance de livraison (à l'heure /
  // en retard) est calculée automatiquement et le shipment passe DELIVERED.
  async recordDelivery(id: string, input: RecordDeliveryInput) {
    const shipment = await this.getById(id);

    let deliveryPerformance = shipment.deliveryPerformance;
    let status = shipment.status;

    const actualArrival = input.actualArrival ?? shipment.actualArrival;

    if (actualArrival && shipment.scheduledArrival) {
      const graceMs = DELIVERY_GRACE_PERIOD_MIN * 60 * 1000;
      deliveryPerformance =
        actualArrival.getTime() <= shipment.scheduledArrival.getTime() + graceMs ? "ON_TIME" : "LATE";
      status = "DELIVERED";
    }

    return prisma.shipment.update({
      where: { id },
      data: {
        driverId: input.driverId ?? shipment.driverId,
        actualDeparture: input.actualDeparture ?? shipment.actualDeparture,
        actualArrival,
        deliveryPerformance,
        status,
      },
      include: SHIPMENT_INCLUDE,
    });
  },
};
