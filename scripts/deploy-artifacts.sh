#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$REPO_ROOT/infrastructure/terraform"
BUNDLE_OUTPUT="$REPO_ROOT/infrastructure/app-bundle.tar.gz"

export AWS_PROFILE="${AWS_PROFILE:-account2}"
export AWS_REGION="${AWS_REGION:-ap-south-1}"

echo "Fetching infrastructure outputs from Terraform..."
ARTIFACT_BUCKET=$(terraform -chdir="$TF_DIR" output -raw artifact_bucket_name)
FRONTEND_BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket_name)
DISTRIBUTION_ID=$(terraform -chdir="$TF_DIR" output -raw frontend_cloudfront_distribution_id)

echo "Target Artifact Bucket: $ARTIFACT_BUCKET"
echo "Target Frontend Bucket: $FRONTEND_BUCKET"
echo "Target CloudFront Distribution: $DISTRIBUTION_ID"

echo "=== 1. Uploading backend application bundle to S3 ==="
if [ ! -f "$BUNDLE_OUTPUT" ]; then
  echo "Error: Bundle not found at $BUNDLE_OUTPUT. Run scripts/build-artifacts.sh first."
  exit 1
fi
aws s3 cp "$BUNDLE_OUTPUT" "s3://$ARTIFACT_BUCKET/app-bundle.tar.gz" --profile "$AWS_PROFILE" --region "$AWS_REGION"

echo "=== 2. Syncing frontend production build to S3 ==="
aws s3 sync "$REPO_ROOT/frontend/dist" "s3://$FRONTEND_BUCKET/" --delete --profile "$AWS_PROFILE" --region "$AWS_REGION"

echo "=== 3. Invalidating CloudFront cache ==="
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --profile "$AWS_PROFILE"

echo "=== Artifacts deployed successfully! ==="
