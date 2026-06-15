import { sendPremiumDailyNotifications } from "./notificationService.js";

const DEFAULT_DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function startPremiumDailyNotificationScheduler() {
  if (process.env.PREMIUM_DAILY_NOTIFICATION_SCHEDULER_ENABLED !== "true") {
    console.log("Premium daily notification scheduler is disabled.");
    return;
  }

  const intervalMs = Number(process.env.PREMIUM_DAILY_NOTIFICATION_INTERVAL_MS || DEFAULT_DAILY_INTERVAL_MS);
  if (!Number.isFinite(intervalMs) || intervalMs < 10000) {
    throw new Error("PREMIUM_DAILY_NOTIFICATION_INTERVAL_MS must be at least 10000.");
  }

  let isRunning = false;

  async function runJob() {
    if (isRunning) {
      console.warn("Premium daily notification scheduler skipped a run because the previous run is still active.");
      return;
    }

    isRunning = true;
    const startedAt = Date.now();

    try {
      const result = await sendPremiumDailyNotifications();
      console.log("[premium-daily-notification-scheduler]", {
        status: "completed",
        durationMs: Date.now() - startedAt,
        total: result.total,
        sent: result.results.filter(item => item.status === "sent").length,
        failed: result.results.filter(item => item.status === "failed").length,
        dryRun: result.results.filter(item => item.status === "dry_run").length
      });
    } catch (error) {
      console.error("[premium-daily-notification-scheduler]", {
        status: "failed",
        durationMs: Date.now() - startedAt,
        message: error.message
      });
    } finally {
      isRunning = false;
    }
  }

  console.log("Premium daily notification scheduler started.", { intervalMs });
  setTimeout(runJob, 2000);
  setInterval(runJob, intervalMs);
}
