import * as authService from "../services/authService.js";
import { successResponse } from "../utils/apiResponse.js";

export async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    successResponse(res, data, "Registration completed successfully.", 201);
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    successResponse(res, data, "Login completed successfully.");
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    successResponse(res, data, "Token refreshed successfully.");
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.body.refreshToken);
    successResponse(res, null, "Logout completed successfully.");
  } catch (err) { next(err); }
}

export async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    successResponse(res, null, "Password reset flow started successfully.");
  } catch (err) { next(err); }
}
