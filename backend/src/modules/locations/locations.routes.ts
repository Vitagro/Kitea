import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { uploadExcel } from "../../common/middleware/upload";
import { locationsController } from "./locations.controller";
import { createLocationSchema, updateLocationSchema } from "./locations.schema";

export const locationsRouter = Router();

locationsRouter.get("/", asyncHandler(locationsController.list));
locationsRouter.get("/export", asyncHandler(locationsController.exportExcel));
locationsRouter.get("/import/template", asyncHandler(locationsController.downloadTemplate));
locationsRouter.post("/import", uploadExcel.single("file"), asyncHandler(locationsController.importExcel));
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
locationsRouter.post("/:id/reactivate", asyncHandler(locationsController.reactivate));
locationsRouter.delete("/:id", asyncHandler(locationsController.deactivate));
