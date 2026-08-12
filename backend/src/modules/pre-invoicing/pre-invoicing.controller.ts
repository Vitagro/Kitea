import { Request, Response } from "express";
import { preInvoicingService } from "./pre-invoicing.service";

export const preInvoicingController = {
  async list(req: Request, res: Response) {
    const { status } = req.query;
    const preInvoices = await preInvoicingService.list(status as string | undefined);
    res.json(preInvoices);
  },

  async getById(req: Request, res: Response) {
    const preInvoice = await preInvoicingService.getById(req.params.id);
    res.json(preInvoice);
  },

  async generate(req: Request, res: Response) {
    const preInvoice = await preInvoicingService.generate(req.body);
    res.status(201).json(preInvoice);
  },

  async attachCarrierInvoice(req: Request, res: Response) {
    const preInvoice = await preInvoicingService.attachCarrierInvoice(req.params.id, req.body);
    res.json(preInvoice);
  },

  async resolveDiscrepancy(req: Request, res: Response) {
    const preInvoice = await preInvoicingService.resolveDiscrepancy(req.params.id, req.body);
    res.json(preInvoice);
  },
};
