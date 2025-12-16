#!/bin/bash
# scripts/dev/shell_backend.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "🐚 Opening Backend Shell..."
docker compose exec backend /bin/bash
