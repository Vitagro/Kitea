import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { vehicleTypesController } from "./vehicle-types.controller";
import { createVehicleTypeSchema, updateVehicleTypeSchema } from "./vehicle-types.schema";

export const vehicleTypesRouter = Router();

vehicleTypesRouter.get("/", asyncHandler(vehicleTypesController.list));
vehicleTypesRouter.get("/:id", asyncHandler(vehicleTypesController.getById));
vehicleTypesRouter.post(
  "/",
  validateRequest(createVehicleTypeSchema),
  asyncHandler(vehicleTypesController.create)
);
vehicleTypesRouter.patch(
  "/:id",
  validateRequest(updateVehicleTypeSchema),
  asyncHandler(vehicleTypesController.update)
);
vehicleTypesRouter.delete("/:id", asyncHandler(vehicleTypesController.deactivate));
