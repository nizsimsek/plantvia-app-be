import * as notificationService from "../services/notificationService.js";
import { successResponse } from "../utils/apiResponse.js";

export async function registerDevice(req, res, next) {
  try {
    successResponse(res, await notificationService.registerDeviceToken(req.user.id, req.body), "Device token registered successfully.");
  } catch (err) { next(err); }
}

export async function removeDevice(req, res, next) {
  try {
    successResponse(res, await notificationService.removeDeviceToken(req.user.id, req.body.token), "Device token deactivated successfully.");
  } catch (err) { next(err); }
}

export async function savePreferences(req, res, next) {
  try {
    successResponse(res, await notificationService.savePreferences(req.user, req.body), "Notification preferences updated successfully.");
  } catch (err) { next(err); }
}

export async function getPreferences(req, res, next) {
  try {
    successResponse(res, await notificationService.getPreferences(req.user.id), "Notification preferences fetched successfully.");
  } catch (err) { next(err); }
}

export async function sendPremiumDaily(req, res, next) {
  try {
    successResponse(res, await notificationService.sendPremiumDailyNotifications(), "Premium daily notification job completed.");
  } catch (err) { next(err); }
}

export async function sendMissYouTest(req, res, next) {
  try {
    successResponse(res, await notificationService.sendMissYouTestNotification(req.body), "Test notification request completed.");
  } catch (err) { next(err); }
}
