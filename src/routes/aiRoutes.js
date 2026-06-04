import { Router } from "express";
import { analyze } from "../controllers/aiController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { aiRateLimit, uploadRateLimit } from "../middlewares/rateLimiters.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

export const aiRoutes = Router();

aiRoutes.post("/analyze-plant", authMiddleware, aiRateLimit, uploadRateLimit, uploadImage.single("image"), analyze);
