#!/bin/bash

PROJECT_ID="shadow-hunter-prod"
REGION="asia-south1"
SERVICE_NAME="shadow-hunter-service"

gcloud run deploy $SERVICE_NAME \
  --image asia-south1-docker.pkg.dev/$PROJECT_ID/shadow-hunter-repo/shadow-hunter:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 5 \
  --set-env-vars ENV=production