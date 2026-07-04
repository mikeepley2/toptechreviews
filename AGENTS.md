# TopTechReviews.org — agent handoff

## What this is

Static editorial site at **toptechreviews.org** publishing “top 10”-style technology buyer guides. Primary business goal: drive qualified traffic to ReferIQ’s managed SEO review while maintaining credibility via 20+ independent categories we do not own.

## Repo layout

```
content/
  site.json           # site metadata + tracking endpoint
  other-guides.json   # 20 non-ReferIQ categories (edit here)
  catalog.json        # generated — do not hand-edit
scripts/
  seed-catalog.mjs    # SEO guide inline + other-guides → catalog.json
  build.mjs           # catalog → dist/ static HTML
assets/
  styles.css          # editorial theme (ReferIQ comparison style)
  tracker.js          # outbound click beacons
  go.js               # client redirect fallback
workers/
  click-tracker.js    # Cloudflare Worker stub for /api/click
dist/                 # build output (gitignored)
```

## Commands

```bash
node scripts/seed-catalog.mjs   # or: npm run seed
npm run build
npm run serve                   # localhost:8787
```

## Categories (21)

1. **Managed SEO** — ReferIQ #1, `ourReviewUrl` → referiq.net review page
2. CRM · 3. Email marketing · 4. Project management · 5. Cloud hosting
6. Password managers · 7. VPN · 8. Video conferencing · 9. Accounting
10. Ecommerce · 11. Help desk · 12. Marketing automation · 13. Website builders
14. HR/payroll · 15. Endpoint security · 16. Cloud backup · 17. AI writing
18. Social media management · 19. Business VoIP · 20. Online legal · 21. Time tracking

To add a category: append to `content/other-guides.json`, run seed + build.

## ReferIQ integration

- SEO winner CTA: `referiq.net/inquire?type=managed_seo&utm_source=toptechreviews&utm_medium=comparison&utm_campaign=best-managed-seo`
- Extended review link on SEO page only: `https://referiq.net/reviews/best-managed-seo-services`

## Click tracking

POST `/api/click` JSON: `{ site, category, vendor, destination, type, path, referrer, ts }`

Worker stores in D1 and forwards to ReferIQ `POST /api/public/marketing-clicks` (see `vantyxreferrals`).

Deploy `workers/click-tracker.js` as a Cloudflare Worker route on `toptechreviews.org/api/click`. See `docs/SECRETS.md`.

## Deploy

Cloudflare Pages: build `npm run seed && npm run build`, publish `dist/`. See `docs/DEPLOY.md`.

## Do not

- Hand-edit `content/catalog.json` (regenerate via seed)
- Commit secrets or affiliate API keys
- Change ReferIQ UTM params without coordinating with ReferIQ marketing
