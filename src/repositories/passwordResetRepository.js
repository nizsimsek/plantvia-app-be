import { db } from "../config/db.js";

export async function savePasswordResetToken(userId, tokenHash, expiresAt) {
  await db.execute(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );
}

export async function findPasswordResetToken(tokenHash) {
  const [rows] = await db.execute(
    "SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL",
    [tokenHash]
  );
  return rows[0] || null;
}

export async function markPasswordResetTokenUsed(tokenHash) {
  await db.execute(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?",
    [tokenHash]
  );
}
