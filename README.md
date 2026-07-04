# TopTechReviews.org

Static comparison site for **toptechreviews.org** — editorial “best of” guides with outbound click tracking.

## Quick start

```bash
npm run seed    # regenerate content/catalog.json from seed data
npm run build   # output static site to dist/
npm run serve   # preview at http://localhost:8787
```

## Content model

| File | Purpose |
|------|---------|
| `content/site.json` | Site name, URL, disclosure, tracking endpoint |
| `content/other-guides.json` | 20 independent category definitions (winner + 5 rivals each) |
| `scripts/seed-catalog.mjs` | Builds `content/catalog.json` (21 guides incl. managed SEO) |
| `scripts/build.mjs` | Generates `dist/` HTML + `_redirects` |

**Managed SEO** (#1 pick: ReferIQ) links to the full review at [referiq.net/reviews/best-managed-seo-services](https://referiq.net/reviews/best-managed-seo-services).

## Click tracking

Outbound links use `/go/{category}/{vendor}` paths. On click:

1. `assets/tracker.js` sends a `sendBeacon` POST to `/api/click`
2. Cloudflare `_redirects` (or `go.js` fallback) 302s to the vendor URL

See [docs/DEPLOY.md](docs/DEPLOY.md) and [docs/CLICK_TRACKING.md](docs/CLICK_TRACKING.md).

## Deploy

Target: **Cloudflare Pages** → `toptechreviews.org`

Build command: `npm run seed && npm run build`  
Output directory: `dist`
