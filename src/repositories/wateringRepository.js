import { db } from "../config/db.js";

export async function addWateringLog(userId, { plantId, wateredAt, note }) {
  const wateringDate = wateredAt ? new Date(wateredAt) : new Date();
  const [result] = await db.execute(
    "INSERT INTO watering_logs (user_id, plant_id, watered_at, note) VALUES (?, ?, ?, ?)",
    [userId, plantId, wateringDate, note]
  );
  await db.execute("UPDATE plants SET last_watered_at = ? WHERE id = ? AND user_id = ?", [wateringDate, plantId, userId]);
  const [rows] = await db.execute(
    "SELECT id, plant_id AS plantId, watered_at AS wateredAt, note FROM watering_logs WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
}

export async function listWateringLogs(userId, plantId, { limit = 50, offset = 0 } = {}) {
  const safeLimit = Number(limit);
  const safeOffset = Number(offset);
  const [[countRows], [rows]] = await Promise.all([
    db.execute("SELECT COUNT(*) AS total FROM watering_logs WHERE user_id = ? AND plant_id = ?", [userId, plantId]),
    db.execute(
      `SELECT id, plant_id AS plantId, watered_at AS wateredAt, note FROM watering_logs WHERE user_id = ? AND plant_id = ? ORDER BY watered_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userId, plantId]
    )
  ]);
  const total = Number(countRows[0]?.total ?? 0);
  return { items: rows, pagination: { total, limit: safeLimit, offset: safeOffset, hasMore: safeOffset + rows.length < total } };
}

export async function listCalendarTasks(userId, startDate, endDate) {
  const [rows] = await db.execute(
    `SELECT id, name, species, location, watering_frequency_days, last_watered_at,
    DATE_ADD(last_watered_at, INTERVAL watering_frequency_days DAY) AS next_watering_at
    FROM plants
    WHERE user_id = ?
    HAVING next_watering_at BETWEEN ? AND ? OR next_watering_at < NOW()
    ORDER BY next_watering_at ASC`,
    [userId, startDate, endDate]
  );
  return rows;
}
