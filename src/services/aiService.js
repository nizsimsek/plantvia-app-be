import { countTodayAiRequests, saveAiRequest } from "../repositories/aiRepository.js";
import { findPlantById } from "../repositories/plantRepository.js";
import { analyzePlantWithOpenAI } from "./openaiService.js";
import { apiError } from "../utils/apiResponse.js";
import { PLANS } from "../utils/constants.js";

const getDailyLimit = () => Number(process.env.PREMIUM_DAILY_AI_LIMIT || 50);

export async function getAiStatus({ user }) {
  if (user.plan !== PLANS.PREMIUM) {
    throw apiError("AI Plant Assistant is available for Premium users only.", 403);
  }
  const limit = getDailyLimit();
  const used = await countTodayAiRequests(user.id);
  return { used, remaining: Math.max(0, limit - used), limit };
}

export async function analyzePlant({ user, plantId, question, imageBuffer, locale = "en" }) {
  if (user.plan !== PLANS.PREMIUM) {
    throw apiError("AI Plant Assistant is available for Premium users only.", 403);
  }

  const limit = getDailyLimit();
  const todayUsage = await countTodayAiRequests(user.id);
  if (todayUsage >= limit) throw apiError("Daily Premium AI analysis limit reached. Please try again tomorrow.", 429);

  const plant = plantId ? await findPlantById(user.id, plantId) : null;

  let analysis;
  try {
    analysis = await analyzePlantWithOpenAI({ imageBuffer, question, plant, locale });
  } catch (error) {
    console.error("OpenAI plant analysis failed:", {
      message: error.message,
      status: error.status || error.code || null,
      type: error.type || null
    });
    throw apiError("AI analysis could not be completed right now. Please try again later.", 503);
  }

  await saveAiRequest({ userId: user.id, plantId, question, answer: analysis.answer, confidenceLevel: analysis.confidenceLevel });
  return {
    answer: analysis.answer,
    suggestions: analysis.suggestions,
    confidenceLevel: analysis.confidenceLevel,
    warning: analysis.warning,
    remaining: Math.max(0, limit - (todayUsage + 1))
  };
}
