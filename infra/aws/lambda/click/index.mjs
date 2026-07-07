/** Lambda handler — forwards click beacons to ReferIQ (AWS host; no D1 buffer). */
export async function handler(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const method = event.requestContext?.http?.method || event.httpMethod || "GET";
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (method !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: cors, body: "Invalid JSON" };
  }

  const headers = event.headers || {};
  const ip =
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.requestContext?.http?.sourceIp ||
    "";
  const ua = headers["user-agent"] || headers["User-Agent"] || "";
  const receivedAt = new Date().toISOString();

  const record = {
    site: payload.site || "toptechreviews.org",
    category: payload.category || "",
    vendor: payload.vendor || "",
    destination: payload.destination || "",
    type: payload.type || "outbound",
    path: payload.path || "",
    referrer: payload.referrer || "",
    ts: payload.ts || receivedAt,
    affiliateNetwork: payload.affiliateNetwork || "",
  };

  const referiqUrl =
    process.env.REFERIQ_MARKETING_CLICK_URL || "https://referiq.net/api/public/marketing-clicks";
  const apiKey = process.env.MARKETING_CLICK_API_KEY || "";

  if (apiKey) {
    try {
      await fetch(referiqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Marketing-Key": apiKey,
        },
        body: JSON.stringify(record),
      });
    } catch (err) {
      console.error("ReferIQ forward failed", err);
    }
  } else {
    console.info("[click]", { ...record, ip, ua });
  }

  return { statusCode: 204, headers: cors, body: "" };
}
