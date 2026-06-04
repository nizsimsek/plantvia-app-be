import { successResponse, apiError } from "../utils/apiResponse.js";
import { assertUploadedImageIsSafe } from "../middlewares/uploadMiddleware.js";

export async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) throw apiError("Image file is required.", 422);
    await assertUploadedImageIsSafe(req.file);
    successResponse(res, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    }, "Photo uploaded successfully.");
  } catch (err) { next(err); }
}
