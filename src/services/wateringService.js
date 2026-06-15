import { addWateringLog, listCalendarTasks, listWateringLogs } from "../repositories/wateringRepository.js";

export async function logWatering(userId, data) {
  return addWateringLog(userId, data);
}

export async function getWateringLogs(userId, plantId, pagination = {}) {
  return listWateringLogs(userId, plantId, pagination);
}

export async function getCalendarTasks(userId, startDate, endDate) {
  return listCalendarTasks(userId, startDate, endDate);
}
