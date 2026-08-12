import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { distanceController } from "./distance.controller";

export const distanceRouter = Router();

distanceRouter.get("/", asyncHandler(distanceController.get));
distanceRouter.post("/build", asyncHandler(distanceController.buildMatrix));
