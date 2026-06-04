import { Router } from "express";
import { status, syncRevenueCat } from "../controllers/subscriptionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

export const subscriptionRoutes = Router();

subscriptionRoutes.get("/status", authMiddleware, status);
subscriptionRoutes.post("/sync-revenuecat", authMiddleware, syncRevenueCat);
