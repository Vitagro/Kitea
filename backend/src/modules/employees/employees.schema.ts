import { z } from "zod";

export const employeeRoleEnum = z.enum([
  "STORE_MANAGER",
  "WAREHOUSE_MANAGER",
  "DRIVER",
  "DISPATCHER",
  "HEAD_OF_LOGISTICS",
]);

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    role: employeeRoleEnum,
    locationId: z.string().uuid().optional(),
    hireDate: z.coerce.date().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: createEmployeeSchema.shape.body.partial().extend({ isActive: z.boolean().optional() }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>["body"];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>["body"];
