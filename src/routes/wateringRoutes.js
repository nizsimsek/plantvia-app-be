import { Router } from "express";
import { calendar, createLog, logs } from "../controllers/wateringController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { wateringLogSchema } from "../models/schemas.js";

export const wateringRoutes = Router();

wateringRoutes.use(authMiddleware);
wateringRoutes.post("/logs", validate(wateringLogSchema), createLog);
wateringRoutes.get("/logs/:plantId", logs);
wateringRoutes.get("/calendar", calendar);

