import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { requireAuth } from "../../common/middleware/requireAuth";
import { authController } from "./auth.controller";
import { loginSchema } from "./auth.schema";

export const authRouter = Router();

// Publique — c'est le seul point d'entrée /api qui ne passe pas par requireAuth.
authRouter.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
