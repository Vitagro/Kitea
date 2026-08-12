import { PrismaClient } from "@prisma/client";

// Instance unique du client Prisma, partagée par tous les modules.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
