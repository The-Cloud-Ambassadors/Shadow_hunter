# Shadow Hunter - Cloud Deployment

This folder contains the deployment artifacts used to build and deploy Shadow Hunter to
Google Cloud Run using Cloud Build and Artifact Registry.

## Build Image
Run Cloud Build (it will tag images using `${SHORT_SHA}`):

```bash
gcloud builds submit --config cloudbuild.yaml .
```

## Deploy to Cloud Run
Pass the image tag created by Cloud Build to the deploy script:

```bash
./deploy.sh <IMAGE_TAG>
```

Example (from CI):

```bash
# Cloud Build sets SHORT_SHA; use that tag for deploy
./deploy.sh ${SHORT_SHA}
```

## Setup Pub/Sub
```bash
./setup_pubsub.sh
```

## Setup Logging Sink
```bash
./setup_logging_sink.sh
```
