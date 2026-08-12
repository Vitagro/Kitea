import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { uploadExcel } from "../../common/middleware/upload";
import { erpIntegrationController } from "./erp-integration.controller";
import { importOrdersBatchSchema, inboundOrderWebhookSchema } from "./erp-integration.schema";

export const erpIntegrationRouter = Router();

// Webhook INBOUND temps réel : une commande/réassort/transfert à la fois.
erpIntegrationRouter.post(
  "/webhooks/orders",
  validateRequest(inboundOrderWebhookSchema),
  asyncHandler(erpIntegrationController.inboundOrder)
);

// Import en masse depuis l'ERP : lot JSON (synchronisation ponctuelle/planifiée).
erpIntegrationRouter.post(
  "/import/orders",
  validateRequest(importOrdersBatchSchema),
  asyncHandler(erpIntegrationController.importOrdersBatch)
);

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
