# Docker Deployment Guide for Arnacon Verification App

This guide explains how to build, run, and deploy the Arnacon Verification App using Docker.

## Prerequisites

- Docker installed on your machine
- Google Cloud SDK (for GCP deployment)
- A Google Cloud Platform account (for GCP deployment)

## Building the Docker Image

To build the Docker image locally:

```bash
docker build -t arnacon-verification-app .
```

## Running the Docker Container Locally

To run the container locally:

```bash
docker run -p 8080:80 arnacon-verification-app
```

The application will be accessible at `http://localhost:8080`.

## Deploying to Google Cloud Run

1. **Update Configuration Variables**

   Edit the `deploy-to-gcloud.sh` script and update these variables:

   ```bash
   PROJECT_ID="your-gcp-project-id"
   IMAGE_NAME="arnacon-verification-app"
   SERVICE_NAME="arnacon-verification-app"
   REGION="us-central1"  # Choose your preferred region
   ```

2. **Run the Deployment Script**

   ```bash
   ./deploy-to-gcloud.sh
   ```

   This script will:
   - Build the Docker image
   - Push it to Google Container Registry
   - Deploy it to Google Cloud Run

3. **Access Your Deployed Application**

   After deployment completes, the script will display a URL where your application is accessible.

## Manual Deployment Steps

If you prefer not to use the script, here are the manual steps:

1. **Build the Docker image**

   ```bash
   docker build -t arnacon-verification-app .
   ```

2. **Tag the image for Google Container Registry**

   ```bash
   docker tag arnacon-verification-app gcr.io/[PROJECT_ID]/arnacon-verification-app
   ```

3. **Authenticate with Google Cloud**

   ```bash
   gcloud auth configure-docker
   ```

4. **Push the image to Google Container Registry**

   ```bash
   docker push gcr.io/[PROJECT_ID]/arnacon-verification-app
   ```

5. **Deploy to Cloud Run**

   ```bash
   gcloud run deploy arnacon-verification-app \
     --image gcr.io/[PROJECT_ID]/arnacon-verification-app \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Troubleshooting

- **Building Issues**: Make sure Docker is running and you have sufficient disk space.
- **Deployment Issues**: Check that you're authenticated with Google Cloud and have the necessary permissions.
- **Runtime Issues**: Check the container logs:
  ```bash
  docker logs [CONTAINER_ID]
  ```

## Environment Variables

If your application requires environment variables, you can add them to the Dockerfile or provide them during deployment:

```bash
gcloud run deploy arnacon-verification-app \
  --image gcr.io/[PROJECT_ID]/arnacon-verification-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="KEY1=VALUE1,KEY2=VALUE2"
``` 