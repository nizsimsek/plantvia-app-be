import { getSubscription } from "../repositories/subscriptionRepository.js";
import { findUserById } from "../repositories/userRepository.js";
import { syncRevenueCatStatusForUser } from "../services/revenueCatService.js";
import { successResponse } from "../utils/apiResponse.js";

export async function status(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    const subscription = await getSubscription(req.user.id);
    successResponse(res, { plan: user?.plan || "free", user, subscription });
  } catch (err) { next(err); }
}

export async function syncRevenueCat(req, res, next) {
  try {
    await syncRevenueCatStatusForUser(req.user.id);
    const user = await findUserById(req.user.id);
    const subscription = await getSubscription(req.user.id);
    successResponse(res, { plan: user?.plan || "free", user, subscription }, "RevenueCat subscription synced successfully.");
  } catch (err) { next(err); }
}
