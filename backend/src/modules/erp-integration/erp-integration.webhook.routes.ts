import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { requireWebhookSecret } from "../../common/middleware/requireWebhookSecret";
import { erpIntegrationController } from "./erp-integration.controller";
import { importOrdersBatchSchema, inboundOrderWebhookSchema } from "./erp-integration.schema";

// Montée dans app.ts AVANT le requireAuth global : ces deux routes sont des
// appels serveur-à-serveur depuis l'ERP, protégés par un secret partagé
// (X-Webhook-Secret) plutôt qu'une session utilisateur.
export const erpWebhookRouter = Router();

erpWebhookRouter.use(requireWebhookSecret);

// Webhook INBOUND temps réel : une commande/réassort/transfert à la fois.
erpWebhookRouter.post(
  "/webhooks/orders",
  validateRequest(inboundOrderWebhookSchema),
  asyncHandler(erpIntegrationController.inboundOrder)
);

// Import en masse depuis l'ERP : lot JSON (synchronisation ponctuelle/planifiée).
erpWebhookRouter.post(
  "/import/orders",
  validateRequest(importOrdersBatchSchema),
  asyncHandler(erpIntegrationController.importOrdersBatch)
);
