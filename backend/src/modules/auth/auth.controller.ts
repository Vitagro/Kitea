import { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id);
    res.json(user);
  },
};
