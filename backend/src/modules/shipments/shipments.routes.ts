import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { shipmentsController } from "./shipments.controller";
import { recordDeliverySchema } from "./shipments.schema";

export const shipmentsRouter = Router();

shipmentsRouter.get("/", asyncHandler(shipmentsController.list));
shipmentsRouter.get("/:id", asyncHandler(shipmentsController.getById));
shipmentsRouter.patch(
  "/:id/delivery",
  validateRequest(recordDeliverySchema),
  asyncHandler(shipmentsController.recordDelivery)
);
