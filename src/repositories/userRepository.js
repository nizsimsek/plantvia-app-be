import { db } from "../config/db.js";

export async function createUser({ nickname, email, passwordHash }) {
  const [result] = await db.execute(
    "INSERT INTO users (nickname, email, password_hash) VALUES (?, ?, ?)",
    [nickname, email, passwordHash]
  );
  return findUserById(result.insertId);
}

export async function findUserByEmail(email) {
  const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await db.execute("SELECT id, nickname, email, plan, created_at FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function updateUserPlan(userId, plan) {
  await db.execute("UPDATE users SET plan = ? WHERE id = ?", [plan, userId]);
  return findUserById(userId);
}

export async function updateUserProfile(userId, { nickname }) {
  await db.execute("UPDATE users SET nickname = ? WHERE id = ?", [nickname, userId]);
  return findUserById(userId);
}
