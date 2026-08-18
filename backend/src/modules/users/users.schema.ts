import { z } from "zod";

export const userRoleEnum = z.enum([
  "SUPER_ADMIN",
  "HEAD_OF_LOGISTICS",
  "DISPATCHER",
  "WAREHOUSE_MANAGER",
  "STORE_MANAGER",
  "FINANCE_CONTROLLER",
  "DRIVER",
  "VIEWER",
]);

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, "8 caractères minimum"),
    fullName: z.string().min(1),
    role: userRoleEnum,
    employeeId: z.string().uuid().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    fullName: z.string().min(1).optional(),
    role: userRoleEnum.optional(),
    employeeId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
