import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./common/middleware/errorHandler";
import { locationsRouter } from "./modules/locations/locations.routes";
import { distanceRouter } from "./modules/distance/distance.routes";
import { pricingRouter } from "./modules/pricing/pricing.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { consolidationRouter } from "./modules/consolidation/consolidation.routes";
import { preInvoicingRouter } from "./modules/pre-invoicing/pre-invoicing.routes";
import { erpIntegrationRouter } from "./modules/erp-integration/erp-integration.routes";
import { vehicleTypesRouter } from "./modules/vehicle-types/vehicle-types.routes";
import { carriersRouter } from "./modules/carriers/carriers.routes";
import { shipmentsRouter } from "./modules/shipments/shipments.routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: "5mb" }));
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "kitea-logistics-backend" });
  });

  app.use("/api/locations", locationsRouter);
  app.use("/api/distance-matrix", distanceRouter);
  app.use("/api/pricing-rules", pricingRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/consolidation", consolidationRouter);
  app.use("/api/pre-invoices", preInvoicingRouter);
  app.use("/api/erp", erpIntegrationRouter);
  app.use("/api/vehicle-types", vehicleTypesRouter);
  app.use("/api/carriers", carriersRouter);
  app.use("/api/shipments", shipmentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
