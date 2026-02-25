#!/bin/bash

gcloud logging sinks create sh-flow-sink \
  pubsub.googleapis.com/projects/shadow-hunter-prod/topics/sh-traffic-topic \
  --log-filter='resource.type="gce_subnetwork"'
gcloud pubsub topics add-iam-policy-binding sh-traffic-topic \
  --member="serviceAccount:service-<PROJECT_NUMBER>@gcp-sa-logging.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
