import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { locationsController } from "./locations.controller";
import { createLocationSchema, updateLocationSchema } from "./locations.schema";

export const locationsRouter = Router();

locationsRouter.get("/", asyncHandler(locationsController.list));
locationsRouter.get("/:id", asyncHandler(locationsController.getById));
locationsRouter.post(
  "/",
  validateRequest(createLocationSchema),
  asyncHandler(locationsController.create)
);
locationsRouter.patch(
  "/:id",
  validateRequest(updateLocationSchema),
  asyncHandler(locationsController.update)
);
locationsRouter.delete("/:id", asyncHandler(locationsController.deactivate));
