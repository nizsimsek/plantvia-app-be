import * as wateringService from "../services/wateringService.js";
import { successResponse } from "../utils/apiResponse.js";
import { paginationSchema } from "../models/schemas.js";

export async function createLog(req, res, next) {
  try { successResponse(res, await wateringService.logWatering(req.user.id, req.body), "Watering log created successfully.", 201); } catch (err) { next(err); }
}

export async function logs(req, res, next) {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    successResponse(res, await wateringService.getWateringLogs(req.user.id, req.params.plantId, { limit, offset }));
  } catch (err) { next(err); }
}

export async function calendar(req, res, next) {
  try {
    const start = req.query.start || new Date().toISOString().slice(0, 10);
    const end = req.query.end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    successResponse(res, await wateringService.getCalendarTasks(req.user.id, start, end));
  } catch (err) { next(err); }
}
