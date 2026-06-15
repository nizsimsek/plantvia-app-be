import { Router } from "express";
import { forgotPassword, login, logout, refresh, register, resetPassword, passwordResetRedirect } from "../controllers/authController.js";
import { authRateLimit } from "../middlewares/rateLimiters.js";
import { validate } from "../middlewares/validate.js";
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema } from "../models/schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimit, validate(registerSchema), register);
authRoutes.post("/login", authRateLimit, validate(loginSchema), login);
authRoutes.post("/refresh", validate(refreshSchema), refresh);
authRoutes.post("/logout", validate(refreshSchema), logout);
authRoutes.post("/forgot-password", authRateLimit, validate(forgotPasswordSchema), forgotPassword);
authRoutes.post("/reset-password", authRateLimit, validate(resetPasswordSchema), resetPassword);
authRoutes.get("/password-reset", passwordResetRedirect);
