#!/bin/bash

# Script to rebuild frontend with optimal Docker caching
# Use this when you need to rebuild after dependency updates

echo "🔄 Rebuilding frontend with optimized caching..."

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1

# Build with cache from existing image
docker build \
  --file Dockerfile.dev \
  --tag ops-frontend-dev:latest \
  --cache-from ops-frontend-dev:latest \
  .

echo "✅ Frontend rebuild complete!"
echo "💡 Run 'docker-compose up frontend' to start the development server"
