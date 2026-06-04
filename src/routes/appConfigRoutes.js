import { Router } from "express";
import { config } from "../controllers/appConfigController.js";

export const appConfigRoutes = Router();

appConfigRoutes.get("/config", config);
