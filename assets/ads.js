/**
 * Display ad loader — AdSense, Carbon, or custom slots from site.json via meta tags.
 */
(function () {
  var adsMeta = document.querySelector('meta[name="toptechreviews:ads"]');
  if (!adsMeta || adsMeta.content !== "enabled") return;

  var providerEl = document.querySelector('meta[name="toptechreviews:ads-provider"]');
  var provider = providerEl ? providerEl.content : "adsense";
  var requireConsentEl = document.querySelector('meta[name="toptechreviews:ads-require-consent"]');
  var requireConsent = !requireConsentEl || requireConsentEl.content !== "false";

  function loadAds() {
    if (provider === "carbon") {
      loadCarbon();
    } else if (provider === "adsense") {
      loadAdSense();
    }
  }

  function loadAdSense() {
    var clientEl = document.querySelector('meta[name="toptechreviews:adsense-client"]');
    var client = clientEl ? clientEl.content : "";
    if (!client) return;

    var slots = document.querySelectorAll(".ad-slot:not(.ad-slot-custom) .ad-unit");
    if (!slots.length) return;

    window.adsbygoogle = window.adsbygoogle || [];
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client);
    script.crossOrigin = "anonymous";
    script.onload = function () {
      slots.forEach(function (unit) {
        if (unit.querySelector("ins.adsbygoogle")) return;
        var ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.setAttribute("data-ad-client", client);
        ins.setAttribute("data-ad-format", "auto");
        ins.setAttribute("data-full-width-responsive", "true");
        unit.appendChild(ins);
        window.adsbygoogle.push({});
      });
    };
    document.head.appendChild(script);
  }

  function loadCarbon() {
    var serveEl = document.querySelector('meta[name="toptechreviews:carbon-serve"]');
    var placementEl = document.querySelector('meta[name="toptechreviews:carbon-placement"]');
    var serve = serveEl ? serveEl.content : "";
    var placement = placementEl ? placementEl.content : "";
    if (!serve) return;

    var script = document.createElement("script");
    script.async = true;
    script.src = "//cdn.carbonads.com/carbon.js?serve=" + encodeURIComponent(serve) + "&placement=" + encodeURIComponent(placement);
    script.id = "_carbonads_js";
    document.getElementById("ad-homeAfterStats") && document.getElementById("ad-homeAfterStats").appendChild(script);
  }

  function init() {
    if (provider === "custom") return;
    if (requireConsent) {
      try {
        if (localStorage.getItem("toptechreviews_consent") === "granted") {
          loadAds();
          return;
        }
      } catch (e) {}
      document.addEventListener("toptechreviews:consent-granted", loadAds);
    } else {
      loadAds();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
