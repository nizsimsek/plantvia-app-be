import { db } from "../config/db.js";

export async function upsertDeviceToken({ userId, token, platform, environment, appVersion }) {
  await db.execute(
    `INSERT INTO device_tokens (user_id, token, platform, environment, app_version, last_seen_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), platform=VALUES(platform), environment=VALUES(environment), app_version=VALUES(app_version), is_active=TRUE, last_seen_at=NOW()`,
    [userId, token, platform, environment, appVersion || null]
  );
}

export async function deactivateDeviceToken(userId, token) {
  await db.execute("UPDATE device_tokens SET is_active = FALSE WHERE user_id = ? AND token = ?", [userId, token]);
}

export async function upsertNotificationPreference({ userId, premiumDailyEnabled, dailyReminderTime, timezone }) {
  await db.execute(
    `INSERT INTO notification_preferences (user_id, premium_daily_enabled, daily_reminder_time, timezone)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE premium_daily_enabled=VALUES(premium_daily_enabled), daily_reminder_time=VALUES(daily_reminder_time), timezone=VALUES(timezone), updated_at=NOW()`,
    [userId, premiumDailyEnabled, dailyReminderTime, timezone]
  );
}

export async function getNotificationPreference(userId) {
  const [rows] = await db.execute(
    `SELECT id, user_id AS userId,
            premium_daily_enabled AS premiumDailyEnabled,
            TIME_FORMAT(daily_reminder_time, '%H:%i') AS dailyReminderTime,
            timezone, created_at AS createdAt, updated_at AS updatedAt
     FROM notification_preferences
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

export async function listPremiumDailyNotificationTargets() {
  const [rows] = await db.execute(
    `SELECT u.id AS user_id, u.nickname, dt.token, dt.environment, np.daily_reminder_time, np.timezone
     FROM users u
     INNER JOIN notification_preferences np ON np.user_id = u.id
     INNER JOIN device_tokens dt ON dt.user_id = u.id
     WHERE u.plan = 'premium'
       AND np.premium_daily_enabled = TRUE
       AND dt.platform = 'ios'
       AND dt.is_active = TRUE`
  );
  return rows;
}

export async function listActiveDeviceTokensByUserId(userId) {
  const [rows] = await db.execute(
    `SELECT dt.token, dt.environment, dt.platform, u.nickname
     FROM device_tokens dt
     INNER JOIN users u ON u.id = dt.user_id
     WHERE dt.user_id = ?
       AND dt.platform = 'ios'
       AND dt.is_active = TRUE`,
    [userId]
  );
  return rows;
}

export async function saveNotificationDelivery({ userId, deviceToken, type, title, body, status, providerResponse }) {
  const [result] = await db.execute(
    `INSERT INTO notification_deliveries (user_id, device_token, type, title, body, status, provider_response)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, deviceToken, type, title, body, status, providerResponse ? JSON.stringify(providerResponse) : null]
  );
  return result.insertId;
}
