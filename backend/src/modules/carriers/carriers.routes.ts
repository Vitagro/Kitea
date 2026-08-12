import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { carriersController } from "./carriers.controller";
import { createCarrierSchema, updateCarrierSchema } from "./carriers.schema";

export const carriersRouter = Router();

carriersRouter.get("/", asyncHandler(carriersController.list));
carriersRouter.get("/:id", asyncHandler(carriersController.getById));
carriersRouter.post("/", validateRequest(createCarrierSchema), asyncHandler(carriersController.create));
carriersRouter.patch("/:id", validateRequest(updateCarrierSchema), asyncHandler(carriersController.update));
carriersRouter.delete("/:id", asyncHandler(carriersController.deactivate));
