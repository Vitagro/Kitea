import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateUserInput, UpdateUserInput } from "./users.schema";

const SALT_ROUNDS = 10;

function sanitize(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export const usersService = {
  async list() {
    const users = await prisma.user.findMany({
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ fullName: "asc" }],
    });
    return users.map(sanitize);
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, include: { employee: true } });
    if (!user) throw AppError.notFound("Utilisateur");
    return sanitize(user);
  },

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.conflict(`Un utilisateur avec l'email "${input.email}" existe déjà`);

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        employeeId: input.employeeId,
        passwordHash,
      },
    });
    return sanitize(user);
  },

  async update(id: string, input: UpdateUserInput) {
    await this.getById(id);
    const { password, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.update({ where: { id }, data });
    return sanitize(user);
  },

  async deactivate(id: string) {
    await this.getById(id);
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    await this.getById(id);
    const user = await prisma.user.update({ where: { id }, data: { isActive: true } });
    return sanitize(user);
  },
};
