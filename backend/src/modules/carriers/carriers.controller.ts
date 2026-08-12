import { Request, Response } from "express";
import { carriersService } from "./carriers.service";

export const carriersController = {
  async list(req: Request, res: Response) {
    const activeOnly = req.query.activeOnly === "true";
    const carriers = await carriersService.list(activeOnly);
    res.json(carriers);
  },

  async getById(req: Request, res: Response) {
    const carrier = await carriersService.getById(req.params.id);
    res.json(carrier);
  },

  async create(req: Request, res: Response) {
    const carrier = await carriersService.create(req.body);
    res.status(201).json(carrier);
  },

  async update(req: Request, res: Response) {
    const carrier = await carriersService.update(req.params.id, req.body);
    res.json(carrier);
  },

  async deactivate(req: Request, res: Response) {
    await carriersService.deactivate(req.params.id);
    res.status(204).send();
  },
};
