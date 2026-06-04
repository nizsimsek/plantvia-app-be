import { Router } from "express";
import { updateMe } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { updateUserSchema } from "../models/schemas.js";

export const userRoutes = Router();

userRoutes.use(authMiddleware);
userRoutes.patch("/me", validate(updateUserSchema), updateMe);
