import { analyzePlant, getAiStatus } from "../services/aiService.js";
import { successResponse, apiError } from "../utils/apiResponse.js";
import { assertUploadedImageIsSafe, deleteUploadedFile } from "../middlewares/uploadMiddleware.js";
import fs from "fs/promises";

export async function status(req, res, next) {
  try {
    const data = await getAiStatus({ user: req.user });
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

export async function analyze(req, res, next) {
  try {
    const question = String(req.body.question || "").trim();
    if (!question) throw apiError("Question is required.", 422);
    if (req.file) await assertUploadedImageIsSafe(req.file);
    const imageBuffer = req.file?.buffer || (req.file?.path ? await fs.readFile(req.file.path) : null);
    
    console.info("[ai-analysis-request]", {
      requestId: req.requestId || null,
      userId: req.user?.id || null,
      plantId: req.body.plantId || null,
      hasImage: Boolean(imageBuffer),
      imageBytes: imageBuffer?.length || 0
    });
    
    const data = await analyzePlant({
      user: req.user,
      plantId: req.body.plantId || null,
      question,
      imageBuffer,
      locale: req.user.language || "tr"
    });
    await deleteUploadedFile(req.file);
    successResponse(res, data, "AI analysis completed successfully.");
  } catch (err) {
    await deleteUploadedFile(req.file);
    next(err);
  }
}
