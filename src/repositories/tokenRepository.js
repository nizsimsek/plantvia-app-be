import { db } from "../config/db.js";

export async function saveRefreshToken(userId, tokenHash, expiresAt) {
  await db.execute("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)", [userId, tokenHash, expiresAt]);
}

export async function findRefreshToken(tokenHash) {
  const [rows] = await db.execute("SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL", [tokenHash]);
  return rows[0] || null;
}

export async function revokeRefreshToken(tokenHash) {
  await db.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
}

export async function revokeAllUserRefreshTokens(userId) {
  await db.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [userId]);
}
