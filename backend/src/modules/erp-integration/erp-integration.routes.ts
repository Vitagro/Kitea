import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { uploadExcel } from "../../common/middleware/upload";
import { erpIntegrationController } from "./erp-integration.controller";

// Routes accédées depuis l'UI (session utilisateur, requireAuth global dans
// app.ts) — distinct de erp-integration.webhook.routes.ts (appels ERP
// serveur-à-serveur, secret partagé, montées avant requireAuth).
export const erpIntegrationRouter = Router();

// Import en masse depuis l'ERP : fichier Excel (export ERP standard).
erpIntegrationRouter.post(
  "/import/orders/excel",
  uploadExcel.single("file"),
  asyncHandler(erpIntegrationController.importOrdersExcel)
);

// Modèle Excel à remplir pour l'import de commandes ERP.
erpIntegrationRouter.get("/import/orders/template", asyncHandler(erpIntegrationController.downloadImportTemplate));

// Consultation du journal d'échanges (traçabilité inbound/outbound).
erpIntegrationRouter.get("/sync-logs", asyncHandler(erpIntegrationController.listLogs));
