import { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { locationsService } from "./locations.service";

export const locationsController = {
  async list(req: Request, res: Response) {
    const { type, city, includeInactive } = req.query;
    const locations = await locationsService.list({
      type: type as string | undefined,
      city: city as string | undefined,
      includeInactive: includeInactive === "true",
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

  async reactivate(req: Request, res: Response) {
    const location = await locationsService.reactivate(req.params.id);
    res.json(location);
  },

  async exportExcel(_req: Request, res: Response) {
    const buffer = await locationsService.exportToExcel();
    sendXlsx(res, buffer, "sites-kitea.xlsx");
  },

  async downloadTemplate(_req: Request, res: Response) {
    const buffer = await locationsService.downloadImportTemplate();
    sendXlsx(res, buffer, "modele-import-sites.xlsx");
  },

  async importExcel(req: Request, res: Response) {
    if (!req.file) throw AppError.badRequest("Aucun fichier reçu (champ 'file' attendu)");
    const result = await locationsService.importFromExcel(req.file.buffer);
    res.json(result);
  },
};

function sendXlsx(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
