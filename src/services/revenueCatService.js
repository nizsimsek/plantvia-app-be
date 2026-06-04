import crypto from "crypto";
import { upsertSubscription } from "../repositories/subscriptionRepository.js";
import { updateUserPlan } from "../repositories/userRepository.js";
import { apiError } from "../utils/apiResponse.js";

const revenueCatApiBaseUrl = "https://api.revenuecat.com/v1";

export function verifyRevenueCatWebhook(rawBody, signature) {
  if (!process.env.REVENUECAT_WEBHOOK_SECRET) return true;
  const expected = crypto.createHmac("sha256", process.env.REVENUECAT_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return signature === expected;
}

export async function syncRevenueCatStatusForUser(userId) {
  const secretApiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!secretApiKey) {
    throw apiError("RevenueCat server API key is not configured.", 503);
  }

  const appUserId = String(userId);
  const entitlementId = process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID || "Plantvia Pro";
  const subscriber = await fetchRevenueCatSubscriber(appUserId, secretApiKey);
  const entitlement = subscriber.entitlements?.[entitlementId];
  const isActive = isEntitlementActive(entitlement);
  const productId = entitlement?.product_identifier || findLatestProductId(subscriber) || "unknown";
  const expiresAt = entitlement?.expires_date ? new Date(entitlement.expires_date) : null;

  await upsertSubscription({
    userId,
    revenueCatUserId: appUserId,
    productId,
    status: isActive ? "active" : "inactive",
    expiresAt
  });

  await updateUserPlan(userId, isActive ? "premium" : "free");

  return {
    premium: isActive,
    entitlementId,
    productId,
    expiresAt
  };
}

export async function handleRevenueCatEvent(event) {
  const appUserId = Number(event.app_user_id);
  if (!appUserId) throw apiError("RevenueCat app_user_id must be a user id.", 422);

  const isActive = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"].includes(event.type);
  const status = isActive ? "active" : "inactive";

  await upsertSubscription({
    userId: appUserId,
    revenueCatUserId: event.app_user_id,
    productId: event.product_id || "unknown",
    status,
    expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null
  });

  await updateUserPlan(appUserId, isActive ? "premium" : "free");
  return { premium: isActive };
}

async function fetchRevenueCatSubscriber(appUserId, secretApiKey) {
  const response = await fetch(`${revenueCatApiBaseUrl}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: {
      Authorization: `Bearer ${secretApiKey}`,
      Accept: "application/json"
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw apiError("RevenueCat subscriber could not be verified.", response.status, payload);
  }

  return payload?.subscriber || {};
}

function isEntitlementActive(entitlement) {
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;
  return Date.parse(entitlement.expires_date) > Date.now();
}

function findLatestProductId(subscriber) {
  const subscriptions = subscriber.subscriptions || {};
  const entries = Object.entries(subscriptions);
  if (!entries.length) return null;

  entries.sort(([, left], [, right]) => {
    const leftDate = Date.parse(left.purchase_date || left.expires_date || 0);
    const rightDate = Date.parse(right.purchase_date || right.expires_date || 0);
    return rightDate - leftDate;
  });

  return entries[0][0];
}
