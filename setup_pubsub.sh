#!/bin/bash

set -euo pipefail

gcloud pubsub topics create sh-traffic-topic || true
gcloud pubsub topics create sh-alerts-topic || true

gcloud pubsub subscriptions create sh-traffic-sub \
  --topic=sh-traffic-topic || true

gcloud pubsub subscriptions create sh-alerts-sub \
  --topic=sh-alerts-topic || true
