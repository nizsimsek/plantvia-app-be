import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserById, updateUserPassword } from "../repositories/userRepository.js";
import { findRefreshToken, revokeAllUserRefreshTokens, revokeRefreshToken, saveRefreshToken } from "../repositories/tokenRepository.js";
import { findPasswordResetToken, markPasswordResetTokenUsed, savePasswordResetToken } from "../repositories/passwordResetRepository.js";
import { sendPasswordResetEmail } from "./emailService.js";
import { apiError } from "../utils/apiResponse.js";

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email, plan: user.plan }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
  });
}

function createRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
  });
}

async function createSession(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await saveRefreshToken(user.id, tokenHash(refreshToken), expiresAt);
  return { user: await findUserById(user.id), accessToken, refreshToken };
}

export async function register({ nickname, email, password }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) throw apiError("A user with this email already exists.", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ nickname, email, passwordHash });
  return createSession(user);
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) throw apiError("Email or password is incorrect.", 401);

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) throw apiError("Email or password is incorrect.", 401);

  return createSession(user);
}

export async function refresh(refreshToken) {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const tokenRecord = await findRefreshToken(tokenHash(refreshToken));
  if (!tokenRecord) throw apiError("Refresh token is invalid.", 401);

  await revokeRefreshToken(tokenHash(refreshToken));

  const user = await findUserById(decoded.id);
  if (!user) throw apiError("User not found.", 404);
  return createSession(user);
}

export async function logout(refreshToken) {
  await revokeRefreshToken(tokenHash(refreshToken));
}

export async function forgotPassword(email) {
  try {
    const user = await findUserByEmail(email);
    if (!user) return; // silently do nothing — don't reveal whether email exists

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hash = tokenHash(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await savePasswordResetToken(user.id, hash, expiresAt);

    const resetUrl = `${process.env.APP_RESET_URL || "plantvia://reset-password"}?token=${rawToken}`;
    await sendPasswordResetEmail({ to: email, nickname: user.nickname, resetUrl });
  } catch (err) {
    console.error("[forgotPassword] Failed:", err.message);
  }
}

export async function resetPassword({ token, password }) {
  const hash = tokenHash(token);
  const record = await findPasswordResetToken(hash);

  if (!record) throw apiError("This reset link is invalid or has already been used.", 400);
  if (new Date(record.expires_at) < new Date()) throw apiError("This reset link has expired. Please request a new one.", 400);

  const passwordHash = await bcrypt.hash(password, 12);
  await updateUserPassword(record.user_id, passwordHash);
  await markPasswordResetTokenUsed(hash);
  await revokeAllUserRefreshTokens(record.user_id);
}
