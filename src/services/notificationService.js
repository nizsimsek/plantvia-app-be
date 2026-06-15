import {
  deactivateDeviceToken,
  getNotificationPreference,
  listActiveDeviceTokensByUserId,
  listPremiumDailyNotificationTargets,
  saveNotificationDelivery,
  upsertDeviceToken,
  upsertNotificationPreference
} from "../repositories/notificationRepository.js";
import { findUserByEmail, findUserById } from "../repositories/userRepository.js";
import { sendApnsNotification } from "./apnsService.js";
import { apiError } from "../utils/apiResponse.js";
import { PLANS } from "../utils/constants.js";

export async function registerDeviceToken(userId, data) {
  await upsertDeviceToken({ userId, ...data });
  return { registered: true };
}

export async function removeDeviceToken(userId, token) {
  await deactivateDeviceToken(userId, token);
  return { removed: true };
}

export async function savePreferences(user, data) {
  if (data.premiumDailyEnabled && user.plan !== PLANS.PREMIUM) {
    throw apiError("Daily premium notifications are available for Premium users only.", 403);
  }

  await upsertNotificationPreference({ userId: user.id, ...data });
  return getNotificationPreference(user.id);
}

export async function getPreferences(userId) {
  return getNotificationPreference(userId);
}

export async function sendPremiumDailyNotifications() {
  const targets = await listPremiumDailyNotificationTargets();
  const results = [];

  for (const target of targets) {
    const title = "Your plant care plan is ready";
    const body = `${target.nickname || "Plantvia"}, check your premium care plan for today.`;

    try {
      const providerResponse = await sendApnsNotification({
        deviceToken: target.token,
        title,
        body,
        environment: target.environment,
        data: { type: "premium_daily_care" }
      });

      await saveNotificationDelivery({
        userId: target.user_id,
        deviceToken: target.token,
        type: "premium_daily_care",
        title,
        body,
        status: providerResponse.dryRun ? "dry_run" : "sent",
        providerResponse
      });
      results.push({ userId: target.user_id, status: providerResponse.dryRun ? "dry_run" : "sent" });
    } catch (error) {
      await saveNotificationDelivery({
        userId: target.user_id,
        deviceToken: target.token,
        type: "premium_daily_care",
        title,
        body,
        status: "failed",
        providerResponse: { message: error.message }
      });
      results.push({ userId: target.user_id, status: "failed", message: error.message });
    }
  }

  return { total: targets.length, results };
}

export async function sendMissYouTestNotification({ userId, email }) {
  const user = userId ? await findUserById(userId) : await findUserByEmail(email);
  if (!user) {
    throw apiError("User was not found.", 404);
  }

  const targets = await listActiveDeviceTokensByUserId(user.id);
  if (targets.length === 0) {
    throw apiError("This user does not have an active iOS device token.", 404);
  }

  const title = "Plantvia";
  const body = `Merhaba ${user.nickname}, bugün seni çok özledik.`;
  const results = [];

  for (const target of targets) {
    try {
      const providerResponse = await sendApnsNotification({
        deviceToken: target.token,
        title,
        body,
        environment: target.environment,
        data: { type: "test_miss_you" }
      });

      await saveNotificationDelivery({
        userId: user.id,
        deviceToken: target.token,
        type: "test_miss_you",
        title,
        body,
        status: providerResponse.dryRun ? "dry_run" : "sent",
        providerResponse
      });
      results.push({ tokenSuffix: target.token.slice(-6), status: providerResponse.dryRun ? "dry_run" : "sent" });
    } catch (error) {
      await saveNotificationDelivery({
        userId: user.id,
        deviceToken: target.token,
        type: "test_miss_you",
        title,
        body,
        status: "failed",
        providerResponse: { message: error.message }
      });
      results.push({ tokenSuffix: target.token.slice(-6), status: "failed", message: error.message });
    }
  }

  return { userId: user.id, total: targets.length, title, body, results };
}
