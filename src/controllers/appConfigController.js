import { successResponse } from "../utils/apiResponse.js";

export async function config(req, res, next) {
  try {
    const platform = req.query.platform || "ios";
    successResponse(res, {
      platform,
      latestVersion: process.env.IOS_LATEST_VERSION || "1.0.0",
      minimumSupportedVersion: process.env.IOS_MIN_SUPPORTED_VERSION || "1.0.0",
      forceUpdate: process.env.IOS_FORCE_UPDATE !== "false",
      message: process.env.IOS_FORCE_UPDATE_MESSAGE || "A new version is required to continue using Plantvia.",
      appStoreUrl: process.env.IOS_APP_STORE_URL || "https://apps.apple.com/app/id0000000000"
    });
  } catch (err) { next(err); }
}
