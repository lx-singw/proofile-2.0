#!/bin/bash
# scripts/dev/clean.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "🧹 Cleaning up..."
docker compose down --remove-orphans
docker system prune -f

# Optional: clean local temp files
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name ".pytest_cache" -exec rm -rf {} +

echo "✅ Cleanup complete."
