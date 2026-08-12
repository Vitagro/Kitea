import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { pricingController } from "./pricing.controller";
import { createPricingRuleSchema, updatePricingRuleSchema } from "./pricing.schema";

export const pricingRouter = Router();

pricingRouter.get("/", asyncHandler(pricingController.list));
pricingRouter.get("/:id", asyncHandler(pricingController.getById));
pricingRouter.post(
  "/",
  validateRequest(createPricingRuleSchema),
  asyncHandler(pricingController.create)
);
pricingRouter.patch(
  "/:id",
  validateRequest(updatePricingRuleSchema),
  asyncHandler(pricingController.update)
);
pricingRouter.delete("/:id", asyncHandler(pricingController.deactivate));
