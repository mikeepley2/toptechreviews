/**
 * Cookie consent banner — gates ad script loading when requireConsent is enabled.
 */
(function () {
  var CONSENT_KEY = "toptechreviews_consent";
  var requireConsentEl = document.querySelector('meta[name="toptechreviews:ads-require-consent"]');
  var adsEnabledEl = document.querySelector('meta[name="toptechreviews:ads"]');
  var requireConsent = !requireConsentEl || requireConsentEl.content !== "false";
  var adsEnabled = adsEnabledEl && adsEnabledEl.content === "enabled";

  function hasConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY) === "granted";
    } catch (e) {
      return false;
    }
  }

  function grantConsent() {
    try {
      localStorage.setItem(CONSENT_KEY, "granted");
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("toptechreviews:consent-granted"));
    var banner = document.getElementById("consent-banner");
    if (banner) banner.remove();
  }

  if (!requireConsent) return;

  if (hasConsent()) {
    document.dispatchEvent(new CustomEvent("toptechreviews:consent-granted"));
    return;
  }

  if (!adsEnabled && !window.GA4_ID) return;

  var banner = document.createElement("div");
  banner.id = "consent-banner";
  banner.className = "consent-banner";
  banner.innerHTML =
    '<div class="consent-inner">' +
    "<p>We use cookies for analytics and advertising. See our <a href=\"/privacy/\">Privacy Policy</a>.</p>" +
    '<button type="button" class="btn btn-primary consent-accept">Accept</button>' +
    "</div>";
  document.body.appendChild(banner);
  banner.querySelector(".consent-accept").addEventListener("click", grantConsent);
})();
