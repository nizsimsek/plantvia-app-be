import fs from "fs";
import http2 from "http2";
import jwt from "jsonwebtoken";

function apnsConfigReady() {
  return Boolean(
    process.env.APNS_KEY_ID &&
      process.env.APNS_TEAM_ID &&
      process.env.APNS_BUNDLE_ID &&
      process.env.APNS_PRIVATE_KEY_PATH &&
      fs.existsSync(process.env.APNS_PRIVATE_KEY_PATH)
  );
}

function createProviderToken() {
  const privateKey = fs.readFileSync(process.env.APNS_PRIVATE_KEY_PATH, "utf8");
  return jwt.sign(
    { iss: process.env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) },
    privateKey,
    {
      algorithm: "ES256",
      header: { alg: "ES256", kid: process.env.APNS_KEY_ID }
    }
  );
}

export async function sendApnsNotification({ deviceToken, title, body, data = {}, environment = "sandbox" }) {
  if (!apnsConfigReady()) {
    return {
      dryRun: true,
      status: "skipped",
      reason: "APNs key configuration has not been added yet.",
      deviceTokenSuffix: deviceToken.slice(-6)
    };
  }

  const host = environment === "production" ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  const client = http2.connect(host);
  const payload = JSON.stringify({
    aps: {
      alert: { title, body },
      sound: "default"
    },
    data
  });

  return await new Promise((resolve, reject) => {
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${createProviderToken()}`,
      "apns-topic": process.env.APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json"
    });

    let responseBody = "";
    let statusCode = 0;

    request.setEncoding("utf8");
    request.on("response", headers => {
      statusCode = Number(headers[":status"]);
    });
    request.on("data", chunk => {
      responseBody += chunk;
    });
    request.on("end", () => {
      client.close();
      resolve({ dryRun: false, statusCode, responseBody });
    });
    request.on("error", error => {
      client.close();
      reject(error);
    });

    request.write(payload);
    request.end();
  });
}
