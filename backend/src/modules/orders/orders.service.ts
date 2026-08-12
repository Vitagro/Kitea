import { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateOrderInput } from "./orders.schema";

export const ordersService = {
  list(status?: OrderStatus) {
    return prisma.order.findMany({
      where: { status },
      include: { origin: true, destination: true, shipment: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { origin: true, destination: true, shipment: true },
    });
    if (!order) throw AppError.notFound("Commande");
    return order;
  },

  async create(input: CreateOrderInput) {
    const existing = await prisma.order.findUnique({ where: { reference: input.reference } });
    if (existing) throw AppError.conflict(`La commande "${input.reference}" existe déjà`);
    return prisma.order.create({ data: input });
  },

  async cancel(id: string) {
    await this.getById(id);
    return prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
  },
};
