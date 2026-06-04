import { db } from "../config/db.js";

export async function upsertSubscription({ userId, revenueCatUserId, productId, status, expiresAt }) {
  await db.execute(
    `INSERT INTO subscriptions (user_id, revenuecat_user_id, product_id, status, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE product_id=VALUES(product_id), status=VALUES(status), expires_at=VALUES(expires_at), updated_at=NOW()`,
    [userId, revenueCatUserId, productId, status, expiresAt]
  );
}

export async function getSubscription(userId) {
  const [rows] = await db.execute("SELECT * FROM subscriptions WHERE user_id = ?", [userId]);
  return rows[0] || null;
}
