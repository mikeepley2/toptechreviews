#!/usr/bin/env bash
# Build, sync dist/ to S3, invalidate CloudFront, update Lambda click handler.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STACK_NAME="${STACK_NAME:-toptechreviews}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SITE_BUCKET="${SITE_BUCKET:-}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-}"

echo "==> Build"
npm run seed && npm run build

echo "==> Package click Lambda"
LAMBDA_ZIP="$ROOT/build/lambda-click.zip"
mkdir -p "$ROOT/build"
rm -f "$LAMBDA_ZIP"
(cd "$ROOT/infra/aws/lambda/click" && zip -q "$LAMBDA_ZIP" index.mjs)

if [[ -z "$SITE_BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  echo "==> Resolve stack outputs"
  SITE_BUCKET="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text)"
  DISTRIBUTION_ID="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)"
fi

echo "==> Update Lambda code"
aws lambda update-function-code \
  --function-name toptechreviews-click \
  --region "$AWS_REGION" \
  --zip-file "fileb://$LAMBDA_ZIP" >/dev/null

echo "==> Sync S3 ($SITE_BUCKET)"
aws s3 sync dist/ "s3://$SITE_BUCKET/" --delete --cache-control "public,max-age=3600"

echo "==> Invalidate CloudFront ($DISTRIBUTION_ID)"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.Id" --output text

echo "Done. Site bucket: $SITE_BUCKET"
