import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

// Valide body/query/params d'une requête contre un schéma Zod.
// Les erreurs sont interceptées par errorHandler (ZodError -> 422).
export function validateRequest(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body ?? req.body;
    next();
  };
}
