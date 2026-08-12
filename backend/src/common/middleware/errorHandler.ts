import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: "ValidationError",
      message: "Payload invalide",
      issues: err.issues,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: "InternalServerError",
    message: "Une erreur inattendue est survenue",
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.path} introuvable`,
  });
}
