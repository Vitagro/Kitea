import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { preInvoicingController } from "./pre-invoicing.controller";
import {
  attachCarrierInvoiceSchema,
  generatePreInvoiceSchema,
  resolveDiscrepancySchema,
} from "./pre-invoicing.schema";

export const preInvoicingRouter = Router();

preInvoicingRouter.get("/", asyncHandler(preInvoicingController.list));
preInvoicingRouter.get("/:id", asyncHandler(preInvoicingController.getById));
preInvoicingRouter.post(
  "/generate",
  validateRequest(generatePreInvoiceSchema),
  asyncHandler(preInvoicingController.generate)
);
preInvoicingRouter.post(
  "/:id/carrier-invoice",
  validateRequest(attachCarrierInvoiceSchema),
  asyncHandler(preInvoicingController.attachCarrierInvoice)
);
preInvoicingRouter.post(
  "/:id/resolve",
  validateRequest(resolveDiscrepancySchema),
  asyncHandler(preInvoicingController.resolveDiscrepancy)
);
