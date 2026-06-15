import { Router } from "express";
import { updateMe, updateSettings } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { updateUserSchema, userSettingsSchema } from "../models/schemas.js";

export const userRoutes = Router();

userRoutes.use(authMiddleware);
userRoutes.patch("/me", validate(updateUserSchema), updateMe);
userRoutes.put("/settings", validate(userSettingsSchema), updateSettings);
