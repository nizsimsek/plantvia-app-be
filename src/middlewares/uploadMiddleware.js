import multer from "multer";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { apiError } from "../utils/apiResponse.js";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIRECTORY || "src/uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const maxUploadSizeBytes = Number(process.env.UPLOAD_MAX_FILE_SIZE_BYTES || 6 * 1024 * 1024);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const rawExtension = path.extname(file.originalname).toLowerCase();
    const extension = allowedExtensions.has(rawExtension) ? rawExtension : ".jpg";
    const safeName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, safeName);
  }
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: maxUploadSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) return cb(apiError("Only JPG, PNG, WEBP, HEIC, and HEIF image files can be uploaded.", 422));
    cb(null, true);
  }
});

export async function assertUploadedImageIsSafe(file) {
  if (!file?.path) throw apiError("Image file is required.", 422);
  try {
    const metadata = await sharp(file.path).metadata();
    if (!metadata.width || !metadata.height) throw new Error("Image dimensions could not be read.");
    if (metadata.width > 6000 || metadata.height > 6000) {
      throw apiError("Image dimensions are too large. Please upload a smaller photo.", 422);
    }
  } catch (error) {
    await deleteUploadedFile(file);
    if (error.status) throw error;
    throw apiError("Uploaded file is not a valid image.", 422);
  }
}

export async function deleteUploadedFile(file) {
  if (!file?.path) return;
  await fsp.unlink(file.path).catch(() => {});
}
