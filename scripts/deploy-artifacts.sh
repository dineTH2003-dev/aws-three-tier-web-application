#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$REPO_ROOT/infrastructure/terraform"
BUNDLE_OUTPUT="$REPO_ROOT/infrastructure/app-bundle.tar.gz"

AWS_REGION="${AWS_REGION:-ap-south-1}"
PROFILE_ARGS=()
if [ -n "${AWS_PROFILE:-}" ] && [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
  PROFILE_ARGS=(--profile "$AWS_PROFILE")
elif [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
  PROFILE_ARGS=(--profile "account2")
fi

echo "Fetching infrastructure outputs from Terraform..."
ARTIFACT_BUCKET=$(terraform -chdir="$TF_DIR" output -raw artifact_bucket_name 2>/dev/null || echo "three-tier-web-dev-artifacts-20261009105225412900000001")
FRONTEND_BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket_name 2>/dev/null || echo "three-tier-web-dev-frontend-20261009105225413600000002")
DISTRIBUTION_ID=$(terraform -chdir="$TF_DIR" output -raw frontend_cloudfront_distribution_id 2>/dev/null || echo "")

echo "Target Artifact Bucket: $ARTIFACT_BUCKET"
echo "Target Frontend Bucket: $FRONTEND_BUCKET"
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "Target CloudFront Distribution: $DISTRIBUTION_ID"
fi

echo "=== 1. Uploading backend application bundle to S3 ==="
if [ ! -f "$BUNDLE_OUTPUT" ]; then
  echo "Error: Bundle not found at $BUNDLE_OUTPUT. Run scripts/build-artifacts.sh first."
  exit 1
fi
aws s3 cp "$BUNDLE_OUTPUT" "s3://$ARTIFACT_BUCKET/app-bundle.tar.gz" ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} --region "$AWS_REGION"

echo "=== 2. Syncing frontend production build to S3 ==="
aws s3 sync "$REPO_ROOT/frontend/dist" "s3://$FRONTEND_BUCKET/" --delete ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} --region "$AWS_REGION"

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "=== 3. Invalidating CloudFront cache ==="
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}
fi

echo "=== Artifacts deployed successfully! ==="
