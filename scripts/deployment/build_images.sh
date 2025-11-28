#!/bin/bash
# scripts/deployment/build_images.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

TAG=${1:-latest}

echo "🏗️  Building Docker images with tag: $TAG..."

docker build -t proofile-backend:$TAG ./backend
docker build -t proofile-frontend:$TAG ./frontend

if [ $? -eq 0 ]; then
  echo "✅ Images built successfully."
else
  echo "❌ Build failed."
  exit 1
fi
