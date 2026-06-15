import crypto from "crypto";
import { handleRevenueCatEvent } from "../services/revenueCatService.js";
import { successResponse, apiError } from "../utils/apiResponse.js";

export async function webhook(req, res, next) {
  try {
    if (!process.env.REVENUECAT_WEBHOOK_SECRET) {
      throw new Error("REVENUECAT_WEBHOOK_SECRET env var is not set.");
    }
    const authorizationHeader = req.headers.authorization || "";
    const bearerSecret = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice("Bearer ".length).trim() : null;
    const incomingSecret = bearerSecret || req.headers["x-revenuecat-secret"] || "";
    const a = Buffer.from(incomingSecret);
    const b = Buffer.from(process.env.REVENUECAT_WEBHOOK_SECRET);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw apiError("RevenueCat webhook verification failed.", 401);
    }

    const event = req.body.event || req.body;
    const data = await handleRevenueCatEvent(event);
    successResponse(res, data, "RevenueCat event processed successfully.");
  } catch (err) { next(err); }
}
