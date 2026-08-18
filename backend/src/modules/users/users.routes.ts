import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validateRequest } from "../../common/middleware/validateRequest";
import { usersController } from "./users.controller";
import { createUserSchema, updateUserSchema } from "./users.schema";

// Montée dans app.ts derrière requireAuth + requireRole("SUPER_ADMIN") :
// toutes ces routes sont réservées aux administrateurs.
export const usersRouter = Router();

usersRouter.get("/", asyncHandler(usersController.list));
usersRouter.get("/:id", asyncHandler(usersController.getById));
usersRouter.post("/", validateRequest(createUserSchema), asyncHandler(usersController.create));
usersRouter.patch("/:id", validateRequest(updateUserSchema), asyncHandler(usersController.update));
usersRouter.post("/:id/reactivate", asyncHandler(usersController.reactivate));
usersRouter.delete("/:id", asyncHandler(usersController.deactivate));
