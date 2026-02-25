# Shadow Hunter - Cloud Deployment

## Build Image
gcloud builds submit --config cloud/cloudbuild.yaml .

## Deploy to Cloud Run
cd cloud
./deploy.sh

## Setup Pub/Sub
./setup_pubsub.sh

## Setup Logging Sink
./setup_logging_sink.sh