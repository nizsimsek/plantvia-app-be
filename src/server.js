import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { startPremiumDailyNotificationScheduler } from "./services/notificationScheduler.js";

dotenv.config();

const app = express();

function parseAllowedOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

app.set("etag", false);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true
}));
app.use(express.json({
  limit: process.env.JSON_BODY_LIMIT || "2mb",
  verify: (req, _res, buffer) => {
    req.rawBody = buffer.toString("utf8");
  }
}));
app.use(requestLogger);
app.use("/uploads", express.static("src/uploads", {
  dotfiles: "deny",
  fallthrough: false,
  immutable: true,
  maxAge: process.env.UPLOAD_CACHE_MAX_AGE || "7d"
}));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Plantvia API is running." });
});

app.use("/api", apiRouter);
app.use(errorMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Plantvia API is running on port ${port}.`);
  startPremiumDailyNotificationScheduler();
});
