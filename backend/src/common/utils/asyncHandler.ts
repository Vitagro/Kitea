import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response) => Promise<void>;

// Express 4 ne catch pas les rejets de promesses dans les handlers async :
// ce wrapper transmet toute erreur à next() pour qu'errorHandler la traite.
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}
