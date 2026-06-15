import { findUserById, updateUserProfile, upsertUserSettings } from "../repositories/userRepository.js";
import { apiError } from "../utils/apiResponse.js";

export async function updateProfile(userId, data) {
  const user = await findUserById(userId);
  if (!user) throw apiError("Session could not be verified.", 401);
  return updateUserProfile(userId, data);
}

export async function saveSettings(userId, data) {
  await upsertUserSettings(userId, data);
  return findUserById(userId);
}
