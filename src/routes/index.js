import { Router } from "express";
import { generalRateLimit } from "../middlewares/rateLimiters.js";
import { authRoutes } from "./authRoutes.js";
import { plantRoutes } from "./plantRoutes.js";
import { wateringRoutes } from "./wateringRoutes.js";
import { aiRoutes } from "./aiRoutes.js";
import { subscriptionRoutes } from "./subscriptionRoutes.js";
import { revenueCatRoutes } from "./revenueCatRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";
import { notificationRoutes } from "./notificationRoutes.js";
import { userRoutes } from "./userRoutes.js";
import { appConfigRoutes } from "./appConfigRoutes.js";

export const apiRouter = Router();

apiRouter.use(generalRateLimit);
apiRouter.use("/app", appConfigRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/plants", plantRoutes);
apiRouter.use("/watering", wateringRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/subscriptions", subscriptionRoutes);
apiRouter.use("/revenuecat", revenueCatRoutes);
apiRouter.use("/uploads", uploadRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/users", userRoutes);
