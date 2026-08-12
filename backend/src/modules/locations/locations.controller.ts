import { Request, Response } from "express";
import { locationsService } from "./locations.service";

export const locationsController = {
  async list(req: Request, res: Response) {
    const { type, city } = req.query;
    const locations = await locationsService.list({
      type: type as string | undefined,
      city: city as string | undefined,
    });
    res.json(locations);
  },

  async getById(req: Request, res: Response) {
    const location = await locationsService.getById(req.params.id);
    res.json(location);
  },

  async create(req: Request, res: Response) {
    const location = await locationsService.create(req.body);
    res.status(201).json(location);
  },

  async update(req: Request, res: Response) {
    const location = await locationsService.update(req.params.id, req.body);
    res.json(location);
  },

  async deactivate(req: Request, res: Response) {
    await locationsService.deactivate(req.params.id);
    res.status(204).send();
  },
};
