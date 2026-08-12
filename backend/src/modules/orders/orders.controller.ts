import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";
import { ordersService } from "./orders.service";

export const ordersController = {
  async list(req: Request, res: Response) {
    const { status } = req.query;
    const orders = await ordersService.list(status as OrderStatus | undefined);
    res.json(orders);
  },

  async getById(req: Request, res: Response) {
    const order = await ordersService.getById(req.params.id);
    res.json(order);
  },

  async create(req: Request, res: Response) {
    const order = await ordersService.create(req.body);
    res.status(201).json(order);
  },

  async cancel(req: Request, res: Response) {
    const order = await ordersService.cancel(req.params.id);
    res.json(order);
  },

  async exportExcel(req: Request, res: Response) {
    const { status } = req.query;
    const buffer = await ordersService.exportToExcel(status as OrderStatus | undefined);
    sendXlsx(res, buffer, "commandes-kitea.xlsx");
  },

  async downloadTemplate(_req: Request, res: Response) {
    const buffer = await ordersService.downloadImportTemplate();
    sendXlsx(res, buffer, "modele-import-commandes.xlsx");
  },

  async importExcel(req: Request, res: Response) {
    if (!req.file) throw AppError.badRequest("Aucun fichier reçu (champ 'file' attendu)");
    const result = await ordersService.importFromExcel(req.file.buffer);
    res.json(result);
  },
};

function sendXlsx(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
