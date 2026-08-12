import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { erpIntegrationController } from "./erp-integration.controller";
import { inboundOrderWebhookSchema } from "./erp-integration.schema";

export const erpIntegrationRouter = Router();

// Webhook INBOUND : commandes/réassorts/transferts émis par l'ERP KITEA.
erpIntegrationRouter.post(
  "/webhooks/orders",
  validateRequest(inboundOrderWebhookSchema),
  asyncHandler(erpIntegrationController.inboundOrder)
);

// Consultation du journal d'échanges (traçabilité inbound/outbound).
erpIntegrationRouter.get("/sync-logs", asyncHandler(erpIntegrationController.listLogs));
