import { Request, Response } from "express";
import { ShipmentStatus } from "@prisma/client";
import { shipmentsService } from "./shipments.service";

export const shipmentsController = {
  async list(req: Request, res: Response) {
    const { status } = req.query;
    const shipments = await shipmentsService.list(status as ShipmentStatus | undefined);
    res.json(shipments);
  },

  async getById(req: Request, res: Response) {
    const shipment = await shipmentsService.getById(req.params.id);
    res.json(shipment);
  },
};
