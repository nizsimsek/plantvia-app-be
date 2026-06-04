import { Router } from "express";
import { webhook } from "../controllers/revenueCatController.js";

export const revenueCatRoutes = Router();

revenueCatRoutes.post("/webhook", webhook);

