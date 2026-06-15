import { Resend } from "resend";
import { apiError } from "../utils/apiResponse.js";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendPasswordResetEmail({ to, nickname, resetUrl }) {
  if (!process.env.RESEND_API_KEY) {
    throw apiError("Email service is not configured.", 503);
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .card { background: #ffffff; max-width: 560px; margin: 0 auto; border-radius: 16px; padding: 40px 36px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { color: #111827; font-size: 22px; margin: 0 0 16px; }
    p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #16a34a; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .note { color: #6b7280; font-size: 13px; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Plantvia — Sifre Sifirlama</h1>
    <p>Merhaba <strong>${nickname}</strong>,</p>
    <p>Plantvia hesabiniz icin sifre sifirlama talebinde bulundunuz. Asagidaki butona tiklayarak yeni sifrenizi belirleyebilirsiniz.</p>
    <a href="${resetUrl}" class="btn">Sifremi Sifirla</a>
    <p class="note">Bu baglanti <strong>1 saat</strong> boyunca gecerlidir.</p>
    <p class="note">Eger bu istegi siz yapmadıysanız bu e-postayı gormezden gelebilirsiniz. Hesabınız guvende.</p>
    <div class="footer">
      <p>Plantvia — Bitki bakım asistanınız</p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Plantvia <noreply@plantvia.app>",
    to,
    subject: "Plantvia — Sifre Sifirlama",
    html
  });
}
