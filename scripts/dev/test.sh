#!/bin/bash
# scripts/dev/test.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

TYPE=${1:-all}

if [ "$TYPE" == "backend" ] || [ "$TYPE" == "all" ]; then
  echo "🧪 Running Backend Tests..."
  docker compose exec backend pytest
fi

if [ "$TYPE" == "frontend" ] || [ "$TYPE" == "all" ]; then
  echo "🧪 Running Frontend Tests..."
  docker compose exec frontend npm test
fi

if [ "$TYPE" == "e2e" ]; then
  echo "🧪 Running E2E Tests..."
  docker compose exec frontend npx playwright test
fi

echo "✅ Tests complete."
