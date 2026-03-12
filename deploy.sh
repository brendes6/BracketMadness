#!/bin/bash
set -euo pipefail

# ── Config ──
PROJECT_ID="${GCP_PROJECT:-cover-the-spread}"
REGION="us-central1"
SERVICE_NAME="cover-the-spread"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== Cover the Spread — Deploy ==="
echo "Project: $PROJECT_ID | Region: $REGION"
echo ""

# ── Step 1: Build frontend ──
echo "→ Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# ── Step 2: Build & push Docker image ──
echo "→ Building Docker image..."
docker build --platform linux/amd64 -t "$IMAGE" .

echo "→ Pushing to GCR..."
docker push "$IMAGE"

# ── Step 3: Deploy to Cloud Run ──
echo "→ Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --memory 256Mi \
  --set-env-vars "TURSO_DATABASE_URL=${TURSO_DATABASE_URL:-},TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN:-},GIN_MODE=release"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')
echo ""
echo "✅ Backend API deployed at: $SERVICE_URL"
echo ""

# ── Step 4: Frontend (Vercel) instructions ──
echo "=== Frontend Deployment (Vercel) ==="
echo "To deploy the frontend, run the following commands:"
echo ""
echo "  npm i -g vercel"
echo "  cd frontend"
echo "  vercel"
echo ""
echo "When prompted by Vercel, set the following environment variable:"
echo "  VITE_API_URL=$SERVICE_URL"
echo ""
echo "=== Done! ==="
