import { z } from "zod";

export const registerSchema = z.object({
  nickname: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const plantSchema = z.object({
  name: z.string().trim().min(1, "Plant name is required."),
  species: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().optional().nullable().default(null),
  location: z.string().trim().min(1, "Plant location is required."),
  wateringFrequencyDays: z.number().int().min(1).max(60),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("09:00"),
  lastWateredAt: z.string().optional(),
  notes: z.string().optional().default("")
});

export const wateringLogSchema = z.object({
  plantId: z.number().int(),
  wateredAt: z.string().optional(),
  note: z.string().optional().default("")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(6)
});

export const deviceTokenSchema = z.object({
  token: z.string().min(32),
  platform: z.enum(["ios"]).default("ios"),
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
  appVersion: z.string().optional().nullable()
});

export const notificationPreferenceSchema = z.object({
  premiumDailyEnabled: z.boolean().optional(),
  freeWeeklyEnabled: z.boolean().optional(),
  dailyReminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("09:00"),
  timezone: z.string().min(2).default("Europe/Istanbul")
});

export const testPushSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  email: z.string().email().optional()
}).refine(data => data.userId || data.email, {
  message: "userId or email is required."
});

export const updateUserSchema = z.object({
  nickname: z.string().trim().min(2, "Nickname must be at least 2 characters.").max(80)
});

export const userSettingsSchema = z.object({
  language: z.enum(["tr", "en"])
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});
