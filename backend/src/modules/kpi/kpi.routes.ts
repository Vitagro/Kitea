import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { kpiController } from "./kpi.controller";

export const kpiRouter = Router();

// Toutes les routes acceptent ?from=ISO_DATE&to=ISO_DATE pour restreindre la période.
kpiRouter.get("/overview", asyncHandler(kpiController.overview));
kpiRouter.get("/rankings/drivers", asyncHandler(kpiController.driverRankings));
kpiRouter.get("/rankings/stores", asyncHandler(kpiController.storeRankings));
kpiRouter.get("/rankings/warehouse-managers", asyncHandler(kpiController.warehouseManagerRankings));
kpiRouter.get("/transport-costs", asyncHandler(kpiController.transportCosts));
