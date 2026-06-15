import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/plantRepository.js", () => ({
  listPlants: vi.fn(),
  countPlantsByUserId: vi.fn(),
  findPlantById: vi.fn(),
  createPlant: vi.fn(),
  updatePlant: vi.fn(),
  deletePlant: vi.fn()
}));
vi.mock("../../src/repositories/userRepository.js", () => ({
  findUserById: vi.fn()
}));

import * as plantRepo from "../../src/repositories/plantRepository.js";
import * as userRepo from "../../src/repositories/userRepository.js";
import * as plantService from "../../src/services/plantService.js";
import { PLANS } from "../../src/utils/constants.js";

const freeUser = { id: 1, plan: PLANS.FREE };
const premiumUser = { id: 2, plan: PLANS.PREMIUM };
const plantData = { name: "Monstera", species: "Monstera Deliciosa", location: "Living Room", wateringFrequencyDays: 7 };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.FREE_PLANT_LIMIT = "3";
});

describe("plantService.createPlant — free plan limit", () => {
  it("allows creation when under the 3-plant limit", async () => {
    userRepo.findUserById.mockResolvedValue(freeUser);
    plantRepo.countPlantsByUserId.mockResolvedValue(2);
    plantRepo.createPlant.mockResolvedValue({ id: 3, ...plantData });
    plantRepo.findPlantById.mockResolvedValue({ id: 3, ...plantData });

    const result = await plantService.createPlant(freeUser.id, plantData);

    expect(plantRepo.createPlant).toHaveBeenCalled();
    expect(result).toHaveProperty("id");
  });

  it("blocks creation when free user has reached the 3-plant limit", async () => {
    userRepo.findUserById.mockResolvedValue(freeUser);
    plantRepo.countPlantsByUserId.mockResolvedValue(3);

    await expect(
      plantService.createPlant(freeUser.id, plantData)
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(plantRepo.createPlant).not.toHaveBeenCalled();
  });

  it("blocks creation at exactly limit (3 plants)", async () => {
    userRepo.findUserById.mockResolvedValue(freeUser);
    plantRepo.countPlantsByUserId.mockResolvedValue(3);

    await expect(
      plantService.createPlant(freeUser.id, plantData)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows premium users to exceed the 3-plant limit", async () => {
    userRepo.findUserById.mockResolvedValue(premiumUser);
    plantRepo.createPlant.mockResolvedValue({ id: 10, ...plantData });
    plantRepo.findPlantById.mockResolvedValue({ id: 10, ...plantData });

    await plantService.createPlant(premiumUser.id, plantData);

    expect(plantRepo.countPlantsByUserId).not.toHaveBeenCalled();
    expect(plantRepo.createPlant).toHaveBeenCalled();
  });
});

describe("plantService.getPlant", () => {
  it("returns plant when found", async () => {
    const plant = { id: 1, name: "Monstera", ...plantData };
    plantRepo.findPlantById.mockResolvedValue(plant);

    const result = await plantService.getPlant(freeUser.id, 1);
    expect(result.id).toBe(1);
  });

  it("throws 404 when plant not found", async () => {
    plantRepo.findPlantById.mockResolvedValue(null);

    await expect(
      plantService.getPlant(freeUser.id, 999)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
