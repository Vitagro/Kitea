import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { consolidationController } from "./consolidation.controller";

export const consolidationRouter = Router();

// Simulation : calcule le regroupement proposé sans écrire en base.
consolidationRouter.get("/preview", asyncHandler(consolidationController.preview));
// Exécution : matérialise les shipments et passe les commandes en CONSOLIDATED.
consolidationRouter.post("/run", asyncHandler(consolidationController.run));
