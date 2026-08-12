import { Request, Response } from "express";
import { PricingRuleType, PricingSource } from "@prisma/client";
import { pricingService } from "./pricing.service";

export const pricingController = {
  async list(req: Request, res: Response) {
    const { ruleType, source, activeOnly } = req.query;
    const rules = await pricingService.list({
      ruleType: ruleType as PricingRuleType | undefined,
      source: source as PricingSource | undefined,
      activeOnly: activeOnly === "true",
    });
    res.json(rules);
  },

  async getById(req: Request, res: Response) {
    const rule = await pricingService.getById(req.params.id);
    res.json(rule);
  },

  async create(req: Request, res: Response) {
    const rule = await pricingService.create(req.body);
    res.status(201).json(rule);
  },

  async update(req: Request, res: Response) {
    const rule = await pricingService.update(req.params.id, req.body);
    res.json(rule);
  },

  async deactivate(req: Request, res: Response) {
    await pricingService.deactivate(req.params.id);
    res.status(204).send();
  },
};
