import { Router } from "express";
import { getPreferences, registerDevice, removeDevice, savePreferences, sendMissYouTest, sendPremiumDaily } from "../controllers/notificationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { internalJobAuthMiddleware } from "../middlewares/internalJobAuthMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { deviceTokenSchema, notificationPreferenceSchema, testPushSchema } from "../models/schemas.js";

export const notificationRoutes = Router();

notificationRoutes.post("/jobs/premium-daily/send", internalJobAuthMiddleware, sendPremiumDaily);
notificationRoutes.post("/test/miss-you/send", internalJobAuthMiddleware, validate(testPushSchema), sendMissYouTest);
notificationRoutes.use(authMiddleware);
notificationRoutes.post("/devices", validate(deviceTokenSchema), registerDevice);
notificationRoutes.delete("/devices", removeDevice);
notificationRoutes.get("/preferences", getPreferences);
notificationRoutes.put("/preferences", validate(notificationPreferenceSchema), savePreferences);
