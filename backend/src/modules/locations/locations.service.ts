import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateLocationInput, UpdateLocationInput } from "./locations.schema";

export const locationsService = {
  list(filters: { type?: string; city?: string }) {
    return prisma.location.findMany({
      where: {
        type: filters.type as never,
        city: filters.city ? { equals: filters.city, mode: "insensitive" } : undefined,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) throw AppError.notFound("Site");
    return location;
  },

  async create(input: CreateLocationInput) {
    const existing = await prisma.location.findUnique({ where: { code: input.code } });
    if (existing) throw AppError.conflict(`Le code site "${input.code}" existe déjà`);
    return prisma.location.create({ data: input });
  },

  async update(id: string, input: UpdateLocationInput) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: input });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.location.update({ where: { id }, data: { isActive: false } });
  },
};
