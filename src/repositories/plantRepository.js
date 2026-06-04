import { db } from "../config/db.js";

export async function listPlants(userId) {
  const [rows] = await db.execute(
    `SELECT p.id, p.name, p.species, p.image_url AS imageUrl, p.location,
            watering_frequency_days AS wateringFrequencyDays,
            TIME_FORMAT(ws.reminder_time, '%H:%i') AS reminderTime,
            p.last_watered_at AS lastWateredAt, p.notes, p.created_at AS createdAt
     FROM plants p
     LEFT JOIN watering_schedules ws ON ws.plant_id = p.id AND ws.is_active = TRUE
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function countPlantsByUserId(userId) {
  const [rows] = await db.execute("SELECT COUNT(*) AS total FROM plants WHERE user_id = ?", [userId]);
  return Number(rows[0]?.total || 0);
}

export async function findPlantById(userId, plantId) {
  const [rows] = await db.execute(
    `SELECT p.id, p.name, p.species, p.image_url AS imageUrl, p.location,
            watering_frequency_days AS wateringFrequencyDays,
            TIME_FORMAT(ws.reminder_time, '%H:%i') AS reminderTime,
            p.last_watered_at AS lastWateredAt, p.notes, p.created_at AS createdAt
     FROM plants p
     LEFT JOIN watering_schedules ws ON ws.plant_id = p.id AND ws.is_active = TRUE
     WHERE p.id = ? AND p.user_id = ?`,
    [plantId, userId]
  );
  return rows[0] || null;
}

export async function createPlant(userId, plant) {
  const connection = await db.getConnection();
  const normalizedPlant = normalizePlantForDatabase(plant);
  const lastWateredAt = plant.lastWateredAt ? new Date(plant.lastWateredAt) : new Date();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "INSERT INTO plants (user_id, name, species, image_url, location, watering_frequency_days, last_watered_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, normalizedPlant.name, normalizedPlant.species, normalizedPlant.imageUrl, normalizedPlant.location, normalizedPlant.wateringFrequencyDays, lastWateredAt, normalizedPlant.notes]
    );
    await connection.execute(
      "INSERT INTO watering_schedules (plant_id, reminder_time, is_active) VALUES (?, ?, TRUE)",
      [result.insertId, normalizedPlant.reminderTime]
    );
    await connection.commit();
    return findPlantById(userId, result.insertId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updatePlant(userId, plantId, plant) {
  const connection = await db.getConnection();
  const normalizedPlant = normalizePlantForDatabase(plant);
  const lastWateredAt = plant.lastWateredAt ? new Date(plant.lastWateredAt) : new Date();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE plants SET name=?, species=?, image_url=?, location=?, watering_frequency_days=?, last_watered_at=?, notes=? WHERE id=? AND user_id=?",
      [normalizedPlant.name, normalizedPlant.species, normalizedPlant.imageUrl, normalizedPlant.location, normalizedPlant.wateringFrequencyDays, lastWateredAt, normalizedPlant.notes, plantId, userId]
    );
    const [scheduleResult] = await connection.execute(
      "UPDATE watering_schedules SET reminder_time=?, is_active=TRUE WHERE plant_id=?",
      [normalizedPlant.reminderTime, plantId]
    );
    if (scheduleResult.affectedRows === 0) {
      await connection.execute(
        "INSERT INTO watering_schedules (plant_id, reminder_time, is_active) VALUES (?, ?, TRUE)",
        [plantId, normalizedPlant.reminderTime]
      );
    }
    await connection.commit();
    return findPlantById(userId, plantId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function deletePlant(userId, plantId) {
  await db.execute("DELETE FROM plants WHERE id = ? AND user_id = ?", [plantId, userId]);
}

function normalizePlantForDatabase(plant) {
  return {
    name: plant.name,
    species: plant.species || "",
    imageUrl: plant.imageUrl || null,
    location: plant.location,
    wateringFrequencyDays: plant.wateringFrequencyDays,
    reminderTime: plant.reminderTime || "09:00",
    notes: plant.notes || ""
  };
}
