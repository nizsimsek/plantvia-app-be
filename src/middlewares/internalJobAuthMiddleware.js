import crypto from "crypto";
import { deleteExpiredInternalJobNonces, saveInternalJobNonce } from "../repositories/internalJobRepository.js";
import { apiError } from "../utils/apiResponse.js";

const MAX_CLOCK_SKEW_SECONDS = Number(process.env.INTERNAL_JOB_MAX_CLOCK_SKEW_SECONDS || 300);

function readInternalClients() {
  try {
    const clients = JSON.parse(process.env.INTERNAL_JOB_CLIENTS || "{}");
    return clients && typeof clients === "object" ? clients : {};
  } catch {
    return {};
  }
}

function createSignature({ secret, timestamp, nonce, method, path, rawBody }) {
  const payload = [timestamp, nonce, method.toUpperCase(), path, rawBody || ""].join(".");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(left || "", "hex");
  const rightBuffer = Buffer.from(right || "", "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function internalJobAuthMiddleware(req, _res, next) {
  try {
    const clientId = String(req.headers["x-internal-client-id"] || "");
    const timestamp = String(req.headers["x-internal-timestamp"] || "");
    const nonce = String(req.headers["x-internal-nonce"] || "");
    const signature = String(req.headers["x-internal-signature"] || "");

    if (!clientId || !timestamp || !nonce || !signature) {
      throw apiError("Internal job authentication headers are missing.", 401);
    }

    const clients = readInternalClients();
    const secret = clients[clientId];
    if (!secret) {
      throw apiError("Internal job client is not allowed.", 401);
    }

    const requestTime = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(requestTime) || Math.abs(now - requestTime) > MAX_CLOCK_SKEW_SECONDS) {
      throw apiError("Internal job request timestamp is not valid.", 401);
    }

    const expectedSignature = createSignature({
      secret,
      timestamp,
      nonce,
      method: req.method,
      path: req.originalUrl,
      rawBody: req.rawBody
    });

    if (!timingSafeEqualText(signature, expectedSignature)) {
      throw apiError("Internal job signature is not valid.", 401);
    }

    const expiresAt = new Date((requestTime + MAX_CLOCK_SKEW_SECONDS) * 1000);
    try {
      await saveInternalJobNonce({ clientId, nonce, expiresAt });
      if (Math.random() < 0.02) {
        await deleteExpiredInternalJobNonces();
      }
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw apiError("Internal job request nonce was already used.", 409);
      }
      throw apiError("Internal job replay protection is not available.", 503);
    }

    req.internalJob = { clientId };
    next();
  } catch (err) {
    next(err);
  }
}
