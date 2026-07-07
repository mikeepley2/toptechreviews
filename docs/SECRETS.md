# GitHub Actions secrets

## Live (2026-07-04)

| Resource | Value |
|----------|-------|
| Pages URL | https://toptechreviews.org |
| Custom domain | `toptechreviews.org` + `www.toptechreviews.org` |
| Pages project | `toptechreviews` |
| D1 database | `toptechreviews-clicks` (`069f27f4-17d4-464b-8583-37c546a6d4d7`) |
| Click API | `POST /api/click` (Pages Function → D1 → ReferIQ) |
| Vault | `kv/toptechreviews/platform` |
| ReferIQ dev vault | `kv/vantyxreferrals/dev` (same `MARKETING_CLICK_API_KEY`) |

Configure in **Settings → Secrets and variables → Actions** for `mikeepley2/toptechreviews`:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | **Account-scoped** API token with at minimum: **Account → Cloudflare Pages → Edit**, **Account → Account Settings → Read**, **User → User Details → Read**. Zone-only DNS tokens will fail CI deploy with `Authentication error [code: 10000]`. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `MARKETING_CLICK_API_KEY` | Shared key with ReferIQ `MARKETING_CLICK_API_KEY` (Worker → `/api/public/marketing-clicks`) |

## AWS (S3 + CloudFront) — optional cutover

See [DEPLOY_AWS.md](DEPLOY_AWS.md). GitHub **variables** (not secrets):

| Variable | Purpose |
|----------|---------|
| `AWS_DEPLOY_ENABLED` | Set `true` to run `.github/workflows/deploy-aws.yml` on push |
| `AWS_SITE_BUCKET` | S3 bucket from CloudFormation stack |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

GitHub **secret**:

| Secret | Purpose |
|--------|---------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role for OIDC (`configure-aws-credentials`) |

One-time stack: `python scripts/provision-aws-full.py` (reads `MARKETING_CLICK_API_KEY` from vault; needs `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` in vault or env)

Or manually: `ACM_CERTIFICATE_ARN` + `MARKETING_CLICK_API_KEY` → `bash scripts/provision-aws.sh`

## ReferIQ (vantyxreferrals)

Set the same value on ReferIQ web app:

```
MARKETING_CLICK_API_KEY=<random-32+-char-secret>
```

After deploy, run migration `20250704120000_marketing_clicks` on ReferIQ DB.

## Cloudflare one-time setup

```bash
# D1 database for edge click buffer
wrangler d1 create toptechreviews-clicks
# Paste database_id into wrangler.toml, then:
wrangler d1 execute toptechreviews-clicks --file=workers/schema.sql

# Worker secret (same as GitHub + ReferIQ)
wrangler secret put MARKETING_CLICK_API_KEY

# Pages project (first deploy via GH Actions or manually)
wrangler pages project create toptechreviews

# Route Worker to domain (Dashboard → Workers → toptechreviews-click → Triggers)
# Route: toptechreviews.org/api/click*
```

## DNS

Point `toptechreviews.org` to Cloudflare Pages (CNAME or custom domain in Pages project).
