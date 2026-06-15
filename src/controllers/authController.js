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

export async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    successResponse(res, null, "Password reset successfully. Please log in with your new password.");
  } catch (err) { next(err); }
}

export function passwordResetRedirect(req, res) {
  const token = req.query.token ?? "";
  const deepLink = `plantvia://reset-password?token=${encodeURIComponent(token)}`;

  if (!token) {
    return res.status(400).send("Geçersiz bağlantı.");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Plantvia — Şifre Sıfırlama</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0fdf4; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 20px; padding: 40px 32px; max-width: 400px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 22px; color: #111827; margin-bottom: 10px; }
    p { font-size: 15px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; }
    .btn { display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-size: 16px; font-weight: 600; }
    .note { font-size: 13px; color: #9ca3af; margin-top: 20px; }
  </style>
  <script>
    window.onload = function() { window.location.href = "${deepLink}"; };
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">🌿</div>
    <h1>Şifre Sıfırlama</h1>
    <p>Plantvia uygulamasında şifrenizi sıfırlamak için aşağıdaki butona dokunun.</p>
    <a href="${deepLink}" class="btn">Uygulamada Aç</a>
    <p class="note">Bu bağlantı 1 saat geçerlidir.</p>
  </div>
</body>
</html>`);
}
