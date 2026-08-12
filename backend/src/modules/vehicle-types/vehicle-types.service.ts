import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateVehicleTypeInput, UpdateVehicleTypeInput } from "./vehicle-types.schema";

export const vehicleTypesService = {
  list(activeOnly = false) {
    return prisma.vehicleType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { maxVolumeM3: "asc" },
    });
  },

  async getById(id: string) {
    const vehicleType = await prisma.vehicleType.findUnique({ where: { id } });
    if (!vehicleType) throw AppError.notFound("Type de véhicule");
    return vehicleType;
  },

  async create(input: CreateVehicleTypeInput) {
    const existing = await prisma.vehicleType.findUnique({ where: { code: input.code } });
    if (existing) throw AppError.conflict(`Le code véhicule "${input.code}" existe déjà`);
    return prisma.vehicleType.create({ data: input });
  },

  async update(id: string, input: UpdateVehicleTypeInput) {
    await this.getById(id);
    return prisma.vehicleType.update({ where: { id }, data: input });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.vehicleType.update({ where: { id }, data: { isActive: false } });
  },
};
