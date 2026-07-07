# Deploy — Cloudflare Pages (legacy)

Production hosting moved to **AWS S3 + CloudFront** — see [DEPLOY_AWS.md](DEPLOY_AWS.md). This doc remains for DNS/email (Cloudflare) and optional Pages fallback.

## DNS

`toptechreviews.org` and `www` CNAME to CloudFront (DNS only / grey cloud). MX/TXT for Zoho stay in Cloudflare.

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

Push to `main` runs `.github/workflows/deploy-aws.yml` when `AWS_DEPLOY_ENABLED=true`. Cloudflare Pages deploy (`.github/workflows/deploy.yml`) is skipped in that case.

## Local preview

```bash
npm run build
npm run serve
# http://localhost:8787
# http://localhost:8787/reviews/best-managed-seo-services/
```

Note: `/go/...` redirects require Cloudflare `_redirects` or a local static server that honors them (e.g. `wrangler pages dev dist`).
