import { Request, Response } from "express";
import { KpiPeriod, kpiService } from "./kpi.service";

function parsePeriod(req: Request): KpiPeriod {
  const { from, to } = req.query;
  return {
    from: from ? new Date(String(from)) : undefined,
    to: to ? new Date(String(to)) : undefined,
  };
}

export const kpiController = {
  async overview(req: Request, res: Response) {
    res.json(await kpiService.getOverview(parsePeriod(req)));
  },

  async driverRankings(req: Request, res: Response) {
    res.json(await kpiService.getDriverRankings(parsePeriod(req)));
  },

  async storeRankings(req: Request, res: Response) {
    res.json(await kpiService.getStoreRankings(parsePeriod(req)));
  },

  async warehouseManagerRankings(req: Request, res: Response) {
    res.json(await kpiService.getWarehouseManagerRankings(parsePeriod(req)));
  },

  async transportCosts(req: Request, res: Response) {
    res.json(await kpiService.getTransportCostBreakdown(parsePeriod(req)));
  },
};
