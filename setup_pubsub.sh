#!/bin/bash

gcloud pubsub topics create sh-traffic-topic
gcloud pubsub topics create sh-alerts-topic

gcloud pubsub subscriptions create sh-traffic-sub \
  --topic=sh-traffic-topic

gcloud pubsub subscriptions create sh-alerts-sub \
  --topic=sh-alerts-topic