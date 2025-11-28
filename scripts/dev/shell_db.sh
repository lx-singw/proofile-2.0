#!/bin/bash
# scripts/dev/shell_db.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "🐚 Opening Database Shell..."
docker compose exec postgres psql -U proofile_user -d proofile_dev
