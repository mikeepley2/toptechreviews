# Deploy — AWS (S3 + CloudFront)

Static site hosting on **Amazon S3** behind **CloudFront**, with a **Lambda Function URL** for `POST /api/click` (forwards to ReferIQ; no D1 on AWS).

Cloudflare Pages remains available via `.github/workflows/deploy.yml` until you cut DNS over.

## Architecture

```
Browser → CloudFront (toptechreviews.org)
            ├─ /*           → S3 bucket (dist/)
            └─ /api/click*  → Lambda → ReferIQ marketing-clicks API
```

| Component | Purpose |
|-----------|---------|
| S3 | Private bucket; HTML, assets, `/go/{cat}/{vendor}/index.html` redirects |
| CloudFront | TLS, CDN, pretty URLs (`/reviews/foo/` → `index.html`) |
| Lambda | Same click beacon contract as Cloudflare Pages Function |
| ACM (us-east-1) | Certificate for `toptechreviews.org` + `www` |

Build output includes **both** Cloudflare `_redirects` and S3-compatible `/go/.../index.html` redirect pages.

---

## One-time setup

### Quick path (recommended)

Add IAM keys to `kv/toptechreviews/platform` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) or export them, then:

```bash
python scripts/provision-aws-full.py
```

This script:

1. Requests ACM cert in **us-east-1** (or reuses an existing one)
2. Adds ACM DNS validation CNAMEs in Cloudflare
3. Waits for certificate issuance
4. Deploys the CloudFormation stack (S3 + CloudFront + Lambda)
5. Builds and syncs `dist/` to S3
6. Deploys GitHub OIDC role + sets GitHub Actions vars/secrets
7. Cuts DNS `@` + `www` to CloudFront (grey cloud)

Use `--skip-dns` to provision AWS without cutting over from Cloudflare Pages yet.

### Manual steps

#### 1. ACM certificate (us-east-1)

Request a public cert in **N. Virginia** for:

- `toptechreviews.org`
- `www.toptechreviews.org`

Validate via DNS (can use Cloudflare DNS records).

### 2. IAM / GitHub OIDC (CI)

Create an IAM role for GitHub Actions with:

- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the site bucket
- `cloudfront:CreateInvalidation` on the distribution
- `lambda:UpdateFunctionCode` on `toptechreviews-click`

Store role ARN as GitHub secret `AWS_DEPLOY_ROLE_ARN`.

Set repository **variables**:

| Variable | Example |
|----------|---------|
| `AWS_DEPLOY_ENABLED` | `true` (after cutover) |
| `AWS_SITE_BUCKET` | `toptechreviews-org-site-123456789012` |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | `E1234ABCDEF` |

### 3. Provision stack

From a machine with [AWS CLI v2](https://aws.amazon.com/cli/):

```bash
export ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID
export MARKETING_CLICK_API_KEY=your-shared-key
bash scripts/provision-aws.sh
```

Or manually:

```bash
aws cloudformation deploy \
  --stack-name toptechreviews \
  --region us-east-1 \
  --template-file infra/aws/template.yaml \
  --parameter-overrides \
    SiteBucketName=toptechreviews-org-site-ACCOUNT \
    AcmCertificateArn=$ACM_CERTIFICATE_ARN \
    MarketingClickApiKey=$MARKETING_CLICK_API_KEY \
  --capabilities CAPABILITY_IAM

bash scripts/deploy-aws.sh
```

### 4. DNS cutover (Cloudflare)

In Cloudflare DNS for `toptechreviews.org`:

| Name | Type | Target | Proxy |
|------|------|--------|-------|
| `@` | CNAME | `dxxxx.cloudfront.net` | **DNS only** (grey cloud) |
| `www` | CNAME | `dxxxx.cloudfront.net` | **DNS only** |

Remove or disable the old Pages CNAME targets after verifying CloudFront.

**Important:** CloudFront requires the orange-cloud proxy off for custom ACM certs on the same domain, unless you use CloudFront as origin through a more advanced setup.

---

## Ongoing deploys

```bash
npm run seed && npm run build
bash scripts/deploy-aws.sh
```

Or push to `main` with `AWS_DEPLOY_ENABLED=true` (`.github/workflows/deploy-aws.yml`).

---

## What changes vs Cloudflare Pages

| Feature | Cloudflare | AWS |
|---------|------------|-----|
| Static HTML | Pages | S3 + CloudFront |
| `/go/*` redirects | `_redirects` | Built `go/.../index.html` pages |
| `/api/click` | Pages Function + D1 | Lambda → ReferIQ only |
| Click buffer (D1) | Yes | No (ReferIQ is source of truth) |

To keep D1 click logging, leave the Cloudflare Worker on a subdomain or dual-write later.

---

## Vault keys (optional)

Add to `kv/toptechreviews/platform`:

```json
{
  "AWS_SITE_BUCKET": "...",
  "AWS_CLOUDFRONT_DISTRIBUTION_ID": "...",
  "AWS_DEPLOY_ROLE_ARN": "..."
}
```

See [SECRETS.md](SECRETS.md).
