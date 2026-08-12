import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateCarrierInput, UpdateCarrierInput } from "./carriers.schema";

export const carriersService = {
  list(activeOnly = false) {
    return prisma.carrier.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    const carrier = await prisma.carrier.findUnique({ where: { id } });
    if (!carrier) throw AppError.notFound("Transporteur");
    return carrier;
  },

  create(input: CreateCarrierInput) {
    return prisma.carrier.create({ data: input });
  },

  async update(id: string, input: UpdateCarrierInput) {
    await this.getById(id);
    return prisma.carrier.update({ where: { id }, data: input });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.carrier.update({ where: { id }, data: { isActive: false } });
  },
};
