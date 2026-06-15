import { db } from "../config/db.js";

export async function createUser({ nickname, email, passwordHash }) {
  const [result] = await db.execute(
    "INSERT INTO users (nickname, email, password_hash) VALUES (?, ?, ?)",
    [nickname, email, passwordHash]
  );
  await db.execute(
    "INSERT IGNORE INTO user_settings (user_id) VALUES (?)",
    [result.insertId]
  );
  return findUserById(result.insertId);
}

export async function findUserByEmail(email) {
  const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await db.execute(
    `SELECT u.id, u.nickname, u.email, u.plan, u.created_at,
            COALESCE(s.language, 'tr') AS language
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function upsertUserSettings(userId, { language }) {
  await db.execute(
    `INSERT INTO user_settings (user_id, language)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE language = VALUES(language), updated_at = NOW()`,
    [userId, language]
  );
}

export async function updateUserPlan(userId, plan) {
  await db.execute("UPDATE users SET plan = ? WHERE id = ?", [plan, userId]);
  return findUserById(userId);
}

export async function updateUserProfile(userId, { nickname }) {
  await db.execute("UPDATE users SET nickname = ? WHERE id = ?", [nickname, userId]);
  return findUserById(userId);
}

export async function updateUserPassword(userId, passwordHash) {
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
}
