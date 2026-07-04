# Deploy — Cloudflare Pages

## DNS

Point `toptechreviews.org` (and `www`) to Cloudflare Pages after connecting the repo.

## Pages project

| Setting | Value |
|---------|-------|
| Build command | `npm run seed && npm run build` |
| Output directory | `dist` |
| Node version | 20+ |

No npm dependencies required for build (stdlib only).

## Post-deploy

1. **D1 + Worker** — see [CLICK_TRACKING.md](CLICK_TRACKING.md) and [SECRETS.md](SECRETS.md)
2. Attach Worker route `toptechreviews.org/api/click*` to `toptechreviews-click`
3. Verify `_redirects`: `/go/best-managed-seo-services/referiq` → ReferIQ
4. Optional: set `ga4Id` in `content/site.json`

## CI/CD

Push to `main` runs `.github/workflows/deploy.yml` (Pages + Worker). Requires GitHub secrets in [SECRETS.md](SECRETS.md).

## Local preview

```bash
npm run build
npm run serve
# http://localhost:8787
# http://localhost:8787/reviews/best-managed-seo-services/
```

Note: `/go/...` redirects require Cloudflare `_redirects` or a local static server that honors them (e.g. `wrangler pages dev dist`).
