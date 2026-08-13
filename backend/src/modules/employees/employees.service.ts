import { EmployeeRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateEmployeeInput, UpdateEmployeeInput } from "./employees.schema";

export const employeesService = {
  list(filters: { role?: EmployeeRole; locationId?: string; activeOnly?: boolean }) {
    return prisma.employee.findMany({
      where: {
        role: filters.role,
        locationId: filters.locationId,
        isActive: filters.activeOnly ? true : undefined,
      },
      include: { location: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({ where: { id }, include: { location: true } });
    if (!employee) throw AppError.notFound("Collaborateur");
    return employee;
  },

  async create(input: CreateEmployeeInput) {
    const existing = await prisma.employee.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.conflict(`Un collaborateur avec l'email "${input.email}" existe déjà`);
    return prisma.employee.create({ data: input });
  },

  async update(id: string, input: UpdateEmployeeInput) {
    await this.getById(id);
    return prisma.employee.update({ where: { id }, data: input });
  },

  async deactivate(id: string) {
    await this.getById(id);
    return prisma.employee.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    await this.getById(id);
    return prisma.employee.update({ where: { id }, data: { isActive: true } });
  },
};
