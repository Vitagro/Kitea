import { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { distanceService } from "./distance.service";

export const distanceController = {
  async get(req: Request, res: Response) {
    const { fromLocationId, toLocationId } = req.query;
    if (!fromLocationId || !toLocationId) {
      throw AppError.badRequest("fromLocationId et toLocationId sont requis");
    }
    const result = await distanceService.getOrCompute(
      String(fromLocationId),
      String(toLocationId)
    );
    res.json(result);
  },

  async buildMatrix(req: Request, res: Response) {
    const { locationIds } = req.body as { locationIds: string[] };
    if (!Array.isArray(locationIds) || locationIds.length < 2) {
      throw AppError.badRequest("locationIds doit contenir au moins 2 sites");
    }
    const matrix = await distanceService.buildMatrix(locationIds);
    res.json(matrix);
  },
};
