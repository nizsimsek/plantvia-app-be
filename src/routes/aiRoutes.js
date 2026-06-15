import { Router } from "express";
import { analyze, status } from "../controllers/aiController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { aiRateLimit, uploadRateLimit } from "../middlewares/rateLimiters.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

export const aiRoutes = Router();

aiRoutes.get("/status", authMiddleware, aiRateLimit, status);
aiRoutes.post("/analyze-plant", authMiddleware, aiRateLimit, uploadRateLimit, uploadImage.single("image"), analyze);
