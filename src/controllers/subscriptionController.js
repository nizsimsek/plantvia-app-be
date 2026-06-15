import { getSubscription } from "../repositories/subscriptionRepository.js";
import { findUserById } from "../repositories/userRepository.js";
import { syncRevenueCatStatusForUser } from "../services/revenueCatService.js";
import { successResponse } from "../utils/apiResponse.js";
import { PLANS } from "../utils/constants.js";

export async function status(req, res, next) {
  try {
    const subscription = await getSubscription(req.user.id);
    successResponse(res, { plan: req.user.plan || PLANS.FREE, user: req.user, subscription });
  } catch (err) { next(err); }
}

export async function syncRevenueCat(req, res, next) {
  try {
    await syncRevenueCatStatusForUser(req.user.id);
    const user = await findUserById(req.user.id);
    const subscription = await getSubscription(req.user.id);
    successResponse(res, { plan: user?.plan || PLANS.FREE, user, subscription }, "RevenueCat subscription synced successfully.");
  } catch (err) { next(err); }
}
