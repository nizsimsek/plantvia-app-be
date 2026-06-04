import { Router } from "express";
import { uploadPhoto } from "../controllers/uploadController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadRateLimit } from "../middlewares/rateLimiters.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

export const uploadRoutes = Router();

uploadRoutes.post("/photo", authMiddleware, uploadRateLimit, uploadImage.single("image"), uploadPhoto);
