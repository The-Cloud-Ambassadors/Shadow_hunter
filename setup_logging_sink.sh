#!/bin/bash
set -euo pipefail

# Configuration
PROJECT_ID="shadow-hunter-prod"
SINK_NAME="sh-flow-sink"
TOPIC="sh-traffic-topic"

# Ensure the Pub/Sub topic exists (create if missing)
if ! gcloud pubsub topics describe "$TOPIC" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Pub/Sub topic $TOPIC not found in project $PROJECT_ID. Creating..."
  gcloud pubsub topics create "$TOPIC" --project="$PROJECT_ID"
fi

# Create the logging sink pointing to the Pub/Sub topic
gcloud logging sinks create "$SINK_NAME" \
  "pubsub.googleapis.com/projects/$PROJECT_ID/topics/$TOPIC" \
  --log-filter='resource.type="gce_subnetwork"' \
  --project="$PROJECT_ID"

# Get writer identity for the sink and grant it publish rights on the topic
SINK_WRITER_IDENTITY=$(gcloud logging sinks describe "$SINK_NAME" --format='value(writerIdentity)' --project="$PROJECT_ID")
echo "Granting roles/pubsub.publisher to $SINK_WRITER_IDENTITY on topic $TOPIC"
gcloud pubsub topics add-iam-policy-binding "$TOPIC" \
  --member="$SINK_WRITER_IDENTITY" \
  --role="roles/pubsub.publisher" \
  --project="$PROJECT_ID"
