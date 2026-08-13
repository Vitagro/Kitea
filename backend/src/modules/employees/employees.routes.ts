import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { employeesController } from "./employees.controller";
import { createEmployeeSchema, updateEmployeeSchema } from "./employees.schema";

export const employeesRouter = Router();

employeesRouter.get("/", asyncHandler(employeesController.list));
employeesRouter.get("/:id", asyncHandler(employeesController.getById));
employeesRouter.post("/", validateRequest(createEmployeeSchema), asyncHandler(employeesController.create));
employeesRouter.patch("/:id", validateRequest(updateEmployeeSchema), asyncHandler(employeesController.update));
employeesRouter.post("/:id/reactivate", asyncHandler(employeesController.reactivate));
employeesRouter.delete("/:id", asyncHandler(employeesController.deactivate));
