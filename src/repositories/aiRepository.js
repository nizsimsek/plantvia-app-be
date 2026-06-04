import { db } from "../config/db.js";

export async function countTodayAiRequests(userId) {
  const [rows] = await db.execute(
    "SELECT COUNT(*) AS total FROM ai_analysis_requests WHERE user_id = ? AND DATE(created_at) = CURDATE()",
    [userId]
  );
  return rows[0].total;
}

export async function saveAiRequest({ userId, plantId, question, answer, confidenceLevel }) {
  const [result] = await db.execute(
    "INSERT INTO ai_analysis_requests (user_id, plant_id, question, answer, confidence_level) VALUES (?, ?, ?, ?, ?)",
    [userId, plantId || null, question, answer, confidenceLevel]
  );
  return result.insertId;
}
