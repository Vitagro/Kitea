import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { ordersController } from "./orders.controller";
import { createOrderSchema } from "./orders.schema";

export const ordersRouter = Router();

ordersRouter.get("/", asyncHandler(ordersController.list));
ordersRouter.get("/:id", asyncHandler(ordersController.getById));
ordersRouter.post("/", validateRequest(createOrderSchema), asyncHandler(ordersController.create));
ordersRouter.post("/:id/cancel", asyncHandler(ordersController.cancel));
