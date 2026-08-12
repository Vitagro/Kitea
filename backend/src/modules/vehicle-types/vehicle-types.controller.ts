import { Request, Response } from "express";
import { vehicleTypesService } from "./vehicle-types.service";

export const vehicleTypesController = {
  async list(req: Request, res: Response) {
    const activeOnly = req.query.activeOnly === "true";
    const vehicleTypes = await vehicleTypesService.list(activeOnly);
    res.json(vehicleTypes);
  },

  async getById(req: Request, res: Response) {
    const vehicleType = await vehicleTypesService.getById(req.params.id);
    res.json(vehicleType);
  },

  async create(req: Request, res: Response) {
    const vehicleType = await vehicleTypesService.create(req.body);
    res.status(201).json(vehicleType);
  },

  async update(req: Request, res: Response) {
    const vehicleType = await vehicleTypesService.update(req.params.id, req.body);
    res.json(vehicleType);
  },

  async deactivate(req: Request, res: Response) {
    await vehicleTypesService.deactivate(req.params.id);
    res.status(204).send();
  },
};
