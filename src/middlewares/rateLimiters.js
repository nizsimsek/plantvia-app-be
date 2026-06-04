import rateLimit from "express-rate-limit";

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const defaultMessage = { success: false, message: "Too many requests were sent. Please try again later." };

export const generalRateLimit = rateLimit({
  windowMs: numberFromEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: numberFromEnv("RATE_LIMIT_MAX", 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultMessage
});

export const authRateLimit = rateLimit({
  windowMs: numberFromEnv("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: numberFromEnv("AUTH_RATE_LIMIT_MAX", 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultMessage
});

export const aiRateLimit = rateLimit({
  windowMs: numberFromEnv("AI_RATE_LIMIT_WINDOW_MS", 60 * 1000),
  limit: numberFromEnv("AI_RATE_LIMIT_MAX", 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI analysis requests were sent in a short time." }
});

export const uploadRateLimit = rateLimit({
  windowMs: numberFromEnv("UPLOAD_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: numberFromEnv("UPLOAD_RATE_LIMIT_MAX", 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many upload requests were sent. Please try again later." }
});
