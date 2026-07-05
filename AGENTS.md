# TopTechReviews.org — agent handoff

## What this is

Static editorial site at **toptechreviews.org** publishing “top 10”-style technology buyer guides. Primary business goal: drive qualified traffic to ReferIQ’s managed SEO review while maintaining credibility via 20+ independent categories we do not own.

## Repo layout

```
content/
  site.json           # site metadata + tracking endpoint
  flagship/           # hand-authored guides (full entries, scores, FAQ)
  other-guides.json   # 20 non-ReferIQ categories (edit here)
  extra-guides.json   # bulk-generated categories (100+)
  catalog.json        # generated — do not hand-edit
scripts/
  seed-catalog.mjs    # flagship + other-guides + extra → catalog.json
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

## How to add or update a review

### Flagship guides (full editorial control)

For high-value comparisons (e.g. managed SEO), add or edit JSON under **`content/flagship/`**:

```
content/flagship/managed-seo-services.json
```

Include the full category object: `slug`, `h1`, `intro`, `entries[]` with scores/pros/cons/review, `faq`, `methodology`, `verdict`. Flagship files **replace** auto-generated stubs with the same `slug`.

Then:

```bash
npm run seed && npm run build
```

### Standard categories (template + rivals)

Append a stub to **`content/other-guides.json`** (or **`content/extra-guides.json`** for bulk):

- `slug`, `h1`, `intro`, `winner`, `rivals[]` — `seed-catalog.mjs` auto-generates scores and copy via `buildGuide()`.

### Two-site strategy (ReferIQ + TopTechReviews)

| Site | Role |
|------|------|
| **toptechreviews.org** | Canonical public comparison hub (independent editorial brand) |
| **referiq.net** | Product CTAs, managed SEO product, SiteRevive intake |

The managed SEO comparison lives at:

`https://toptechreviews.org/reviews/best-managed-seo-services/`

ReferIQ `/reviews/best-managed-seo-services` redirects there (avoid duplicate content).

## Categories (121+)

1. **Managed SEO** — ReferIQ #1 (flagship JSON, 8 providers)
2–21. CRM, email marketing, project management, … (see `other-guides.json`)
22+. Bulk categories from `extra-guides.json`

To add a category: edit the appropriate JSON, run `npm run seed && npm run build`.

## ReferIQ integration

- SEO winner CTA: `referiq.net/inquire?type=managed_seo&utm_source=toptechreviews&utm_medium=comparison&utm_campaign=best-managed-seo`
- Do **not** duplicate the full comparison on referiq.net — canonical URL is TopTechReviews.

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
