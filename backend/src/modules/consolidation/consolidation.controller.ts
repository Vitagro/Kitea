import { Request, Response } from "express";
import { consolidationService } from "./consolidation.service";

export const consolidationController = {
  async preview(_req: Request, res: Response) {
    const shipments = await consolidationService.preview();
    res.json(shipments);
  },

  async run(_req: Request, res: Response) {
    const shipments = await consolidationService.run();
    res.status(201).json(shipments);
  },
};
