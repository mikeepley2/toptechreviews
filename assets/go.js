/** Client-side redirect for static hosts without edge redirects */
(function () {
  var parts = location.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts[0] !== "go" || parts.length < 3) {
    document.body.textContent = "Invalid redirect link.";
    return;
  }
  var key = parts[1] + "/" + parts[2];
  var mapEl = document.getElementById("outbound-map");
  var map = mapEl ? JSON.parse(mapEl.textContent) : {};
  var dest = map[key];
  if (!dest) {
    document.body.textContent = "Destination not found.";
    return;
  }
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/click",
      new Blob(
        [JSON.stringify({ site: "toptechreviews.org", category: parts[1], vendor: parts[2], destination: dest, type: "redirect" })],
        { type: "application/json" }
      )
    );
  }
  location.replace(dest);
})();
