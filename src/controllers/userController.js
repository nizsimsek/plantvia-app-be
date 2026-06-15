import * as userService from "../services/userService.js";
import { successResponse } from "../utils/apiResponse.js";

export async function updateMe(req, res, next) {
  try {
    successResponse(res, await userService.updateProfile(req.user.id, req.body), "Profile updated successfully.");
  } catch (err) { next(err); }
}

export async function updateSettings(req, res, next) {
  try {
    successResponse(res, await userService.saveSettings(req.user.id, req.body), "Settings updated successfully.");
  } catch (err) { next(err); }
}
