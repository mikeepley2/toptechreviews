# GitHub Actions secrets

Configure in **Settings → Secrets and variables → Actions** for `mikeepley2/toptechreviews`:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Pages deploy + D1 + Workers (**Account-scoped** — zone-only DNS tokens will fail) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `MARKETING_CLICK_API_KEY` | Shared key with ReferIQ `MARKETING_CLICK_API_KEY` (Worker → `/api/public/marketing-clicks`) |

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
