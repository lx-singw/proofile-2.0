#!/bin/bash
# scripts/dev/lint.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "🧹 Linting Backend..."
docker compose exec backend ruff check .
docker compose exec backend black --check .

echo "🧹 Linting Frontend..."
docker compose exec frontend npm run lint

echo "✅ Linting complete."
