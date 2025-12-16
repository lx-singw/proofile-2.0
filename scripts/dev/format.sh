#!/bin/bash
# scripts/dev/format.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "✨ Formatting Backend..."
docker compose exec backend black .
docker compose exec backend ruff check --fix .

echo "✨ Formatting Frontend..."
# Assuming prettier or similar is set up, or just lint fix
docker compose exec frontend npm run lint -- --fix

echo "✅ Formatting complete."
