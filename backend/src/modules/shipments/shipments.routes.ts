import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { shipmentsController } from "./shipments.controller";

export const shipmentsRouter = Router();

shipmentsRouter.get("/", asyncHandler(shipmentsController.list));
shipmentsRouter.get("/:id", asyncHandler(shipmentsController.getById));
