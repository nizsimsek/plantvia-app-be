import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/aiRepository.js", () => ({
  countTodayAiRequests: vi.fn(),
  saveAiRequest: vi.fn()
}));
vi.mock("../../src/repositories/plantRepository.js", () => ({
  findPlantById: vi.fn()
}));
vi.mock("../../src/services/openaiService.js", () => ({
  analyzePlantWithOpenAI: vi.fn()
}));

import * as aiRepo from "../../src/repositories/aiRepository.js";
import * as openaiService from "../../src/services/openaiService.js";
import { analyzePlant, getAiStatus } from "../../src/services/aiService.js";
import { PLANS } from "../../src/utils/constants.js";

const premiumUser = { id: 1, plan: PLANS.PREMIUM };
const freeUser = { id: 2, plan: PLANS.FREE };
const mockAnalysis = { answer: "Looks healthy.", suggestions: ["Water weekly."], confidenceLevel: "High", warning: "No issues." };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PREMIUM_DAILY_AI_LIMIT = "50";
});

describe("getAiStatus", () => {
  it("returns correct usage counts for premium user", async () => {
    aiRepo.countTodayAiRequests.mockResolvedValue(10);

    const status = await getAiStatus({ user: premiumUser });

    expect(status.used).toBe(10);
    expect(status.remaining).toBe(40);
    expect(status.limit).toBe(50);
  });

  it("throws 403 for free user", async () => {
    await expect(getAiStatus({ user: freeUser })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("remaining never goes below 0 when usage exceeds limit", async () => {
    aiRepo.countTodayAiRequests.mockResolvedValue(55);
    const status = await getAiStatus({ user: premiumUser });
    expect(status.remaining).toBe(0);
  });
});

describe("analyzePlant — daily limit enforcement", () => {
  it("allows analysis when under daily limit", async () => {
    aiRepo.countTodayAiRequests.mockResolvedValue(49);
    aiRepo.saveAiRequest.mockResolvedValue(1);
    openaiService.analyzePlantWithOpenAI.mockResolvedValue(mockAnalysis);

    const result = await analyzePlant({ user: premiumUser, question: "Is my plant healthy?", imageBuffer: null });

    expect(openaiService.analyzePlantWithOpenAI).toHaveBeenCalled();
    expect(result.remaining).toBe(0);
  });

  it("blocks analysis when daily limit (50) is reached", async () => {
    aiRepo.countTodayAiRequests.mockResolvedValue(50);

    await expect(
      analyzePlant({ user: premiumUser, question: "Help?", imageBuffer: null })
    ).rejects.toMatchObject({ statusCode: 429 });

    expect(openaiService.analyzePlantWithOpenAI).not.toHaveBeenCalled();
  });

  it("throws 403 for free user attempting analysis", async () => {
    await expect(
      analyzePlant({ user: freeUser, question: "Help?", imageBuffer: null })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("returns remaining count after successful analysis", async () => {
    aiRepo.countTodayAiRequests.mockResolvedValue(20);
    aiRepo.saveAiRequest.mockResolvedValue(1);
    openaiService.analyzePlantWithOpenAI.mockResolvedValue(mockAnalysis);

    const result = await analyzePlant({ user: premiumUser, question: "Status?", imageBuffer: null });

    expect(result.remaining).toBe(29);
  });

  it("wraps OpenAI errors as 503", async () => {
    aiRepo.countTodayAiRequests.mockResolvedValue(0);
    openaiService.analyzePlantWithOpenAI.mockRejectedValue(new Error("OpenAI timeout"));

    await expect(
      analyzePlant({ user: premiumUser, question: "Help?", imageBuffer: null })
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});
