import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("../../src/repositories/subscriptionRepository.js", () => ({
  upsertSubscription: vi.fn()
}));
vi.mock("../../src/repositories/userRepository.js", () => ({
  findUserById: vi.fn(),
  updateUserPlan: vi.fn()
}));

import * as subscriptionRepo from "../../src/repositories/subscriptionRepository.js";
import * as userRepo from "../../src/repositories/userRepository.js";
import { verifyRevenueCatWebhook, handleRevenueCatEvent } from "../../src/services/revenueCatService.js";
import { PLANS } from "../../src/utils/constants.js";

const TEST_SECRET = "test-webhook-secret-for-unit-tests";

function makeSignature(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.REVENUECAT_WEBHOOK_SECRET = TEST_SECRET;
});

describe("verifyRevenueCatWebhook", () => {
  it("returns true for a valid HMAC signature", () => {
    const body = JSON.stringify({ type: "RENEWAL", app_user_id: "1" });
    const sig = makeSignature(body, TEST_SECRET);
    expect(verifyRevenueCatWebhook(body, sig)).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const body = JSON.stringify({ type: "RENEWAL", app_user_id: "1" });
    const sig = makeSignature(body, TEST_SECRET);
    const tamperedBody = JSON.stringify({ type: "RENEWAL", app_user_id: "2" });
    expect(verifyRevenueCatWebhook(tamperedBody, sig)).toBe(false);
  });

  it("returns false for a wrong secret", () => {
    const body = JSON.stringify({ type: "RENEWAL", app_user_id: "1" });
    const sig = makeSignature(body, "wrong-secret");
    expect(verifyRevenueCatWebhook(body, sig)).toBe(false);
  });

  it("returns false for mismatched signature lengths", () => {
    const body = JSON.stringify({ type: "RENEWAL" });
    expect(verifyRevenueCatWebhook(body, "short")).toBe(false);
  });

  it("throws when REVENUECAT_WEBHOOK_SECRET is not set", () => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
    expect(() => verifyRevenueCatWebhook("body", "sig")).toThrow("REVENUECAT_WEBHOOK_SECRET");
  });
});

describe("handleRevenueCatEvent — plan transitions", () => {
  it("upgrades user to premium on INITIAL_PURCHASE", async () => {
    subscriptionRepo.upsertSubscription.mockResolvedValue();
    userRepo.updateUserPlan.mockResolvedValue();

    await handleRevenueCatEvent({ type: "INITIAL_PURCHASE", app_user_id: "1", product_id: "plantvia_monthly" });

    expect(userRepo.updateUserPlan).toHaveBeenCalledWith(1, PLANS.PREMIUM);
  });

  it("upgrades user to premium on RENEWAL", async () => {
    subscriptionRepo.upsertSubscription.mockResolvedValue();
    userRepo.updateUserPlan.mockResolvedValue();

    await handleRevenueCatEvent({ type: "RENEWAL", app_user_id: "5", product_id: "plantvia_yearly" });

    expect(userRepo.updateUserPlan).toHaveBeenCalledWith(5, PLANS.PREMIUM);
  });

  it("does NOT change plan on CANCELLATION (user still has access until period end)", async () => {
    const result = await handleRevenueCatEvent({ type: "CANCELLATION", app_user_id: "2", product_id: "plantvia_monthly" });

    expect(result.skipped).toBe(true);
    expect(userRepo.updateUserPlan).not.toHaveBeenCalled();
    expect(subscriptionRepo.upsertSubscription).not.toHaveBeenCalled();
  });

  it("does NOT change plan on BILLING_ISSUE (RevenueCat grace period is active)", async () => {
    const result = await handleRevenueCatEvent({ type: "BILLING_ISSUE", app_user_id: "2", product_id: "plantvia_monthly" });

    expect(result.skipped).toBe(true);
    expect(userRepo.updateUserPlan).not.toHaveBeenCalled();
  });

  it("downgrades user to free on EXPIRATION", async () => {
    subscriptionRepo.upsertSubscription.mockResolvedValue();
    userRepo.updateUserPlan.mockResolvedValue();

    await handleRevenueCatEvent({ type: "EXPIRATION", app_user_id: "3" });

    expect(userRepo.updateUserPlan).toHaveBeenCalledWith(3, PLANS.FREE);
  });

  it("upgrades user to premium on INITIAL_PURCHASE (covers trial start)", async () => {
    subscriptionRepo.upsertSubscription.mockResolvedValue();
    userRepo.updateUserPlan.mockResolvedValue();

    await handleRevenueCatEvent({ type: "INITIAL_PURCHASE", app_user_id: "4", product_id: "plantvia_yearly", is_trial_period: true });

    expect(userRepo.updateUserPlan).toHaveBeenCalledWith(4, PLANS.PREMIUM);
  });

  it("throws 422 when app_user_id is missing or non-numeric", async () => {
    await expect(
      handleRevenueCatEvent({ type: "RENEWAL", app_user_id: "not-a-number" })
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});
