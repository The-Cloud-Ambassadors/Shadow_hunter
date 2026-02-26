#!/bin/bash
set -euo pipefail

PROJECT_ID="shadow-hunter-prod"
REGION="asia-south1"
SERVICE_NAME="shadow-hunter-service"
# IMAGE_TAG may be passed as first argument; defaults to 'latest' if not provided
IMAGE_TAG="${1:-latest}"

echo "Ensure you're authenticated and the correct project is selected:"
gcloud auth list --filter=status:ACTIVE --format="value(account)" || true
echo "Target project: $PROJECT_ID"

# Optionally set the project for this gcloud session (uncomment to enable)
# gcloud config set project "$PROJECT_ID"

gcloud run deploy "$SERVICE_NAME" \
  --image asia-south1-docker.pkg.dev/$PROJECT_ID/shadow-hunter-repo/shadow-hunter:${IMAGE_TAG} \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 5 \
  --set-env-vars ENV=production

echo "Note: For production deployments consider using a service account and removing --allow-unauthenticated if you require IAM protection. Use immutable image tags instead of :latest for reproducible deployments."
