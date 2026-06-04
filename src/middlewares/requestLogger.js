import crypto from "crypto";

const hiddenFieldText = "[hidden]";
const sensitiveFields = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "accessToken",
  "refreshToken",
  "token",
  "authorization",
  "apiKey",
  "secret"
]);

export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const logPayload = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
      userId: req.user?.id || null
    };

    if (process.env.REQUEST_LOG_BODY === "true") {
      logPayload.query = sanitizeValue(req.query);
      logPayload.body = sanitizeValue(req.body);
    }

    const message = `[request] ${JSON.stringify(logPayload)}`;
    if (res.statusCode >= 500) {
      console.error(message);
    } else if (res.statusCode >= 400) {
      console.warn(message);
    } else {
      console.info(message);
    }
  });

  next();
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, item]) => {
      accumulator[key] = sensitiveFields.has(key) ? hiddenFieldText : sanitizeValue(item);
      return accumulator;
    }, {});
  }

  return value;
}
