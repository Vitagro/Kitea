import { Request, Response } from "express";
import { erpIntegrationService } from "./erp-integration.service";

export const erpIntegrationController = {
  async inboundOrder(req: Request, res: Response) {
    const order = await erpIntegrationService.handleInboundOrder(req.body);
    res.status(201).json(order);
  },

  async listLogs(req: Request, res: Response) {
    const { direction } = req.query;
    const logs = await erpIntegrationService.listLogs(direction as "INBOUND" | "OUTBOUND" | undefined);
    res.json(logs);
  },
};
