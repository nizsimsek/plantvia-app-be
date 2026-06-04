import { Router } from "express";
import { create, detail, list, remove, update } from "../controllers/plantController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { plantSchema } from "../models/schemas.js";

export const plantRoutes = Router();

plantRoutes.use(authMiddleware);
plantRoutes.get("/", list);
plantRoutes.post("/", validate(plantSchema), create);
plantRoutes.get("/:id", detail);
plantRoutes.put("/:id", validate(plantSchema), update);
plantRoutes.delete("/:id", remove);

