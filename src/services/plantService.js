import * as plantRepository from "../repositories/plantRepository.js";
import { findUserById } from "../repositories/userRepository.js";
import { apiError } from "../utils/apiResponse.js";
import { PLANS } from "../utils/constants.js";

const freePlantLimit = Number(process.env.FREE_PLANT_LIMIT || 3);

export async function getPlants(userId, pagination = {}) {
  return plantRepository.listPlants(userId, pagination);
}

export async function getPlant(userId, plantId) {
  const plant = await plantRepository.findPlantById(userId, plantId);
  if (!plant) throw apiError("Plant not found.", 404);
  return plant;
}

export async function createPlant(userId, data) {
  const user = await findUserById(userId);
  if (!user) throw apiError("Session could not be verified.", 401);

  if (user.plan !== PLANS.PREMIUM) {
    const plantCount = await plantRepository.countPlantsByUserId(userId);
    if (plantCount >= freePlantLimit) {
      throw apiError(`Free plan supports up to ${freePlantLimit} plants. Upgrade to Premium for unlimited plants.`, 403);
    }
  }

  return plantRepository.createPlant(userId, data);
}

export async function updatePlant(userId, plantId, data) {
  await getPlant(userId, plantId);
  return plantRepository.updatePlant(userId, plantId, data);
}

export async function deletePlant(userId, plantId) {
  await getPlant(userId, plantId);
  await plantRepository.deletePlant(userId, plantId);
}
