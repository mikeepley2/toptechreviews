/**
 * Outbound click tracking for TopTechReviews.org
 * - Sends beacon to TRACKING_ENDPOINT (Cloudflare Worker / ReferIQ analytics)
 * - Optional GA4 events when window.gtag is available
 */
(function () {
  const siteMeta = document.querySelector('meta[name="toptechreviews:category"]');
  const categoryFromMeta = siteMeta ? siteMeta.content : "";

  function trackingEndpoint() {
    const el = document.querySelector('meta[name="toptechreviews:tracking"]');
    return (el && el.content) || "/api/click";
  }

  function trackClick(payload) {
    const body = JSON.stringify({
      ...payload,
      site: "toptechreviews.org",
      path: location.pathname,
      referrer: document.referrer || "",
      ts: new Date().toISOString(),
    });

    const url = trackingEndpoint();
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(function () {});
    }

    if (window.GA4_ID && typeof window.gtag === "function") {
      var eventName = payload.vendor === "editorial-inquiry" ? "editorial_inquiry_click" : "outbound_click";
      window.gtag("event", eventName, {
        category: payload.category,
        vendor: payload.vendor,
        destination: payload.destination,
        affiliate: payload.affiliate || false,
      });
    }
  }

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a.outbound");
    if (!a) return;
    const category = a.dataset.category || categoryFromMeta || "";
    const vendor = a.dataset.vendor || "";
    const href = a.getAttribute("href") || "";
    trackClick({
      category: category,
      vendor: vendor,
      destination: href,
      type: "outbound",
      affiliate: a.dataset.affiliate === "true",
      affiliateNetwork: a.dataset.affiliateNetwork || "",
    });
  });
})();
