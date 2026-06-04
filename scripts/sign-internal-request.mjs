import crypto from "crypto";

const [, , method, path, body = ""] = process.argv;
const clientId = process.env.INTERNAL_JOB_CLIENT_ID || "notification-worker";
const secret = process.env.INTERNAL_JOB_SECRET;

if (!method || !path || !secret) {
  console.error("Usage: INTERNAL_JOB_SECRET=... node scripts/sign-internal-request.mjs POST /api/notifications/test/miss-you/send '{\"userId\":1}'");
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomUUID();
const payload = [timestamp, nonce, method.toUpperCase(), path, body].join(".");
const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

console.log(`x-internal-client-id: ${clientId}`);
console.log(`x-internal-timestamp: ${timestamp}`);
console.log(`x-internal-nonce: ${nonce}`);
console.log(`x-internal-signature: ${signature}`);
