# Custom domain — toptechreviews.org

## Status

| Item | State |
|------|-------|
| Cloudflare zone | Active (`toptechreviews.org`) |
| Pages project | `toptechreviews` → https://toptechreviews-asz.pages.dev |
| Custom domains (Pages) | **Active** — `toptechreviews.org`, `www.toptechreviews.org` |
| Proxy worker | Removed (Pages custom domain serves traffic directly) |

## Finish DNS (one-time)

Create a **zone-scoped API token** (DNS Edit) — browser should open pre-filled:

https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=[{"key":"dns_records","type":"edit"},{"key":"zone","type":"read"}]&name=toptechreviews-dns&zoneId=15f6a24dcd19a1fc7dbe338ead207dac&accountId=ce5386b2fc97a5d44d4a1a7446f8ac2c

Then either:

```powershell
$env:TOPTECHREVIEWS_DNS_TOKEN = "paste-token-here"
python scripts/setup-dns.py
```

Or store in Vault and rerun:

```powershell
# kv/toptechreviews/platform → CLOUDFLARE_DNS_API_TOKEN
python scripts/setup-dns.py
```

## Records created

| Name | Type | Target | Proxy |
|------|------|--------|-------|
| `@` | CNAME | `toptechreviews-asz.pages.dev` | On |
| `www` | CNAME | `toptechreviews-asz.pages.dev` | On |

After DNS propagates (1–5 min), Pages custom domains should become **Active** and https://toptechreviews.org serves the site.

## Manual alternative

Cloudflare Dashboard → **toptechreviews.org** → **DNS** → Add record (×2 as above).

Then **Pages** → **toptechreviews** → **Custom domains** → Refresh until Active.
