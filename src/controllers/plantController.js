import * as plantService from "../services/plantService.js";
import { successResponse } from "../utils/apiResponse.js";
import { paginationSchema } from "../models/schemas.js";

export async function list(req, res, next) {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    successResponse(res, await plantService.getPlants(req.user.id, { limit, offset }));
  } catch (err) { next(err); }
}

export async function detail(req, res, next) {
  try { successResponse(res, await plantService.getPlant(req.user.id, req.params.id)); } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try { successResponse(res, await plantService.createPlant(req.user.id, req.body), "Plant created successfully.", 201); } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try { successResponse(res, await plantService.updatePlant(req.user.id, req.params.id, req.body), "Plant updated successfully."); } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    await plantService.deletePlant(req.user.id, req.params.id);
    successResponse(res, null, "Plant deleted successfully.");
  } catch (err) { next(err); }
}
