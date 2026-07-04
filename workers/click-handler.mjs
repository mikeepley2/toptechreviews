/** Shared click handler for Cloudflare Worker and Pages Functions */
export async function handleClickRequest(request, env) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: cors });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ua = request.headers.get("User-Agent") || "";
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
  };

  if (env.CLICKS) {
    try {
      await env.CLICKS.prepare(
        `INSERT INTO clicks (site, category, vendor, destination, type, path, referrer, user_agent, ip, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          record.site,
          record.category,
          record.vendor,
          record.destination,
          record.type,
          record.path,
          record.referrer,
          ua,
          ip,
          receivedAt,
        )
        .run();
    } catch (err) {
      console.error("D1 insert failed", err);
    }
  }

  const referiqUrl = env.REFERIQ_MARKETING_CLICK_URL || "https://referiq.net/api/public/marketing-clicks";
  if (env.MARKETING_CLICK_API_KEY) {
    try {
      await fetch(referiqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Marketing-Key": env.MARKETING_CLICK_API_KEY,
        },
        body: JSON.stringify(record),
      });
    } catch (err) {
      console.error("ReferIQ forward failed", err);
    }
  }

  return new Response(null, { status: 204, headers: cors });
}
