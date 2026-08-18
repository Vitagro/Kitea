import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../errors/AppError";

// Les appels entrants de l'ERP (serveur à serveur) n'ont pas de session
// utilisateur — ils s'authentifient via un secret partagé plutôt qu'un JWT.
export function requireWebhookSecret(req: Request, _res: Response, next: NextFunction): void {
  const provided = req.headers["x-webhook-secret"];
  if (provided !== env.erpWebhookSecret) throw AppError.unauthorized("Secret webhook invalide");
  next();
}
