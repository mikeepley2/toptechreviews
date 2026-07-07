#!/usr/bin/env bash
# One-time AWS stack for TopTechReviews.org (S3 + CloudFront + Lambda click API).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STACK_NAME="${STACK_NAME:-toptechreviews}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SITE_BUCKET="${SITE_BUCKET:-toptechreviews-org-site-$(aws sts get-caller-identity --query Account --output text)}"
DOMAIN="${DOMAIN:-toptechreviews.org}"
CERT_ARN="${ACM_CERTIFICATE_ARN:-}"
MARKETING_KEY="${MARKETING_CLICK_API_KEY:-}"

if [[ -z "$CERT_ARN" ]]; then
  echo "Set ACM_CERTIFICATE_ARN (us-east-1 cert for $DOMAIN + www)" >&2
  exit 1
fi
if [[ -z "$MARKETING_KEY" ]]; then
  echo "Set MARKETING_CLICK_API_KEY" >&2
  exit 1
fi

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --template-file "$ROOT/infra/aws/template.yaml" \
  --parameter-overrides \
    "SiteBucketName=$SITE_BUCKET" \
    "DomainName=$DOMAIN" \
    "WwwDomainName=www.$DOMAIN" \
    "AcmCertificateArn=$CERT_ARN" \
    "MarketingClickApiKey=$MARKETING_KEY" \
  --capabilities CAPABILITY_IAM

bash "$ROOT/scripts/deploy-aws.sh"

CF_DOMAIN="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)"

echo ""
echo "Stack ready. Point DNS CNAME for $DOMAIN and www.$DOMAIN to:"
echo "  $CF_DOMAIN"
echo ""
echo "If using Cloudflare DNS: CNAME to $CF_DOMAIN (DNS only / grey cloud)."
