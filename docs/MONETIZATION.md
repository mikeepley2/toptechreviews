# Monetization runbook — TopTechReviews.org

Revenue stack (highest ROI first): **ReferIQ funnel → SaaS affiliates → sponsored banners → display ads**.

## Configuration files

| File | Purpose |
|------|---------|
| [`content/site.json`](../content/site.json) | `ga4Id`, `ads` block, disclosure text |
| [`content/affiliate-links.json`](../content/affiliate-links.json) | Vendor slug → affiliate URL (empty `url` = inactive) |
| [`content/sponsored-slots.json`](../content/sponsored-slots.json) | Paid banner placements by guide slug |
| [`content/legal/`](../content/legal/) | Privacy + affiliate disclosure pages |

After any change: `npm run seed && npm run build` then deploy.

---

## Phase 1 — Analytics (GA4)

1. Create a GA4 property for `toptechreviews.org`.
2. Set `"ga4Id": "G-XXXXXXXX"` in [`content/site.json`](../content/site.json).
3. Rebuild and deploy.
4. Verify in GA4 Realtime; click an outbound link and confirm `outbound_click` / `editorial_inquiry_click` events.

---

## Phase 1 — Affiliate links

1. Apply to partner programs (Impact, PartnerStack, vendor direct programs).
2. Add approved URLs to [`content/affiliate-links.json`](../content/affiliate-links.json) keyed by **vendor slug** (matches catalog entry `slug`, e.g. `hubspot`, `shopify`).
3. Run `npm run seed` — [`scripts/seed-catalog.mjs`](../scripts/seed-catalog.mjs) sets `ctaUrl`, `isAffiliate`, and `affiliateNetwork` on catalog entries.
4. Verify a redirect: open a guide → click Visit → confirm `/go/...` lands on affiliate URL.
5. Click beacons include `affiliateNetwork` when present.

**Priority categories:** CRM, ecommerce, email marketing, cloud hosting, VPN, accounting (see [`content/other-guides.json`](../content/other-guides.json)).

**Do not change** ReferIQ managed SEO UTMs without coordinating with ReferIQ marketing.

---

## Phase 2 — Display ads

### Prerequisites

- Privacy policy live at `/privacy/` (built from [`content/legal/privacy.json`](../content/legal/privacy.json)).
- Affiliate disclosure at `/affiliate-disclosure/`.

### Google AdSense

1. Apply at [google.com/adsense](https://www.google.com/adsense).
2. In [`content/site.json`](../content/site.json):

```json
"ads": {
  "enabled": true,
  "provider": "adsense",
  "adsenseClient": "ca-pub-XXXXXXXXXXXXXXXX",
  "excludeSlugs": ["best-managed-seo-services"],
  "requireConsent": true,
  "slots": {
    "homeAfterStats": true,
    "reviewAfterHero": true,
    "reviewMidContent": true,
    "reviewBeforeVerdict": false
  }
}
```

3. Rebuild, deploy, accept cookie banner on site, confirm ad units render.

### Carbon Ads (alternative)

Set `"provider": "carbon"`, `"carbonServe": "YOUR_SERVE_ID"`, `"carbonPlacement": "toptechreviewsorg"`.

### Custom direct deals

Set `"provider": "custom"` and paste HTML into `"customHtml"`.

---

## Phase 3 — Sponsored placements

Edit [`content/sponsored-slots.json`](../content/sponsored-slots.json):

```json
[
  {
    "slug": "best-crm-software",
    "sponsorName": "Example CRM",
    "sponsorUrl": "https://example.com",
    "label": "Sponsored",
    "expires": "2026-12-31"
  }
]
```

Banners appear above the winner box with *"Paid placement — does not affect our rankings."*

Sales: use the **Submit inquiry** button on site (ReferIQ inquire form).

---

## Click tracking

Outbound clicks POST to `/api/click` with optional `affiliateNetwork`.

**New D1 column** on existing databases:

```bash
wrangler d1 execute toptechreviews-clicks --file=workers/migrations/001_affiliate_network.sql
```

See [CLICK_TRACKING.md](CLICK_TRACKING.md).

---

## Deploy

### GitHub Actions (recommended)

Ensure [`docs/SECRETS.md`](SECRETS.md) token has **Account → Cloudflare Pages → Edit**. Update `CLOUDFLARE_API_TOKEN` in GitHub repo secrets if CI fails with `Authentication error [code: 10000]`.

Push to `main` runs `.github/workflows/deploy.yml`.

### Manual deploy

```bash
npm run seed && npm run build
npx wrangler pages deploy dist --project-name=toptechreviews
```

---

## Weekly optimization

1. GA4 → top landing pages and outbound click rate.
2. D1 / ReferIQ dashboard → clicks by category and vendor.
3. Affiliate network dashboards → conversions.
4. Add affiliate URLs for top-performing vendors.
5. Expand flagship guides ([`content/flagship/`](../content/flagship/)) for high-traffic categories.
