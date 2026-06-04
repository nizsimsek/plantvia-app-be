import { db } from "../config/db.js";

export async function saveInternalJobNonce({ clientId, nonce, expiresAt }) {
  await db.execute(
    "INSERT INTO internal_job_nonces (client_id, nonce, expires_at) VALUES (?, ?, ?)",
    [clientId, nonce, expiresAt]
  );
}

export async function deleteExpiredInternalJobNonces() {
  await db.execute("DELETE FROM internal_job_nonces WHERE expires_at < NOW()");
}
