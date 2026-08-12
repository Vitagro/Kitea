import { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { erpIntegrationService } from "./erp-integration.service";

export const erpIntegrationController = {
  async inboundOrder(req: Request, res: Response) {
    const order = await erpIntegrationService.handleInboundOrder(req.body);
    res.status(201).json(order);
  },

  async importOrdersBatch(req: Request, res: Response) {
    const { orders } = req.body as { orders: Parameters<typeof erpIntegrationService.importOrdersBatch>[0] };
    const result = await erpIntegrationService.importOrdersBatch(orders);
    res.status(201).json(result);
  },

  async importOrdersExcel(req: Request, res: Response) {
    if (!req.file) throw AppError.badRequest("Aucun fichier reçu (champ 'file' attendu)");
    const result = await erpIntegrationService.importOrdersFromExcel(req.file.buffer);
    res.status(201).json(result);
  },

  async downloadImportTemplate(_req: Request, res: Response) {
    const buffer = await erpIntegrationService.downloadImportTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="modele-import-commandes-erp.xlsx"');
    res.send(buffer);
  },

  async listLogs(req: Request, res: Response) {
    const { direction } = req.query;
    const logs = await erpIntegrationService.listLogs(direction as "INBOUND" | "OUTBOUND" | undefined);
    res.json(logs);
  },
};
