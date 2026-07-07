# Inquiry email — TopTechReviews.org

TopTechReviews uses the **Vantyx Zoho Mail pattern**: alias → primary inbox → **Delivered To** filter → `/Vantyx/toptechreviews/support1`.

## Flow

| Step | Detail |
|------|--------|
| Site CTA | `inquiryUrl` with **`product=toptechreviews`** |
| ReferIQ sends to | `support@toptechreviews.org` |
| Zoho filter | **Delivered To** = `support@toptechreviews.org` → `/Vantyx/toptechreviews/support1` |

## Aliases

| Address | Folder |
|---------|--------|
| `support@toptechreviews.org` | `/Vantyx/toptechreviews/support1` |
| `noreply@toptechreviews.org` | `/Vantyx/toptechreviews/noreply` |
| `alerts@toptechreviews.org` | `/Vantyx/toptechreviews/alerts` |

## Zoho filters (native rules)

Settings → Filters → Incoming. Use **Delivered To**, not To.

| Filter name | Delivered To | Move to |
|-------------|--------------|---------|
| vantyx toptechreviews support | `support@toptechreviews.org` | `/Vantyx/toptechreviews/support1` |
| vantyx toptechreviews noreply | `noreply@toptechreviews.org` | `/Vantyx/toptechreviews/noreply` |
| vantyx toptechreviews alerts | `alerts@toptechreviews.org` | `/Vantyx/toptechreviews/alerts` |

Stack reference: `vantyxstack/observability/optional/zoho-mail/FILTER_SETUP.md`

## ReferIQ

Partner product `toptechreviews` → `alertEmailsJson: ["support@toptechreviews.org"]`.

## Test

1. Gmail → `support@toptechreviews.org` → `/Vantyx/toptechreviews/support1`
2. Submit inquiry at https://toptechreviews.org/#inquiry
