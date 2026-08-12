import { ShipmentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";

export const shipmentsService = {
  list(status?: ShipmentStatus) {
    return prisma.shipment.findMany({
      where: { status },
      include: {
        origin: true,
        destination: true,
        vehicleType: true,
        carrier: true,
        orders: true,
        preInvoice: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        origin: true,
        destination: true,
        vehicleType: true,
        carrier: true,
        orders: true,
        preInvoice: true,
      },
    });
    if (!shipment) throw AppError.notFound("Shipment");
    return shipment;
  },
};
