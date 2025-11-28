#!/bin/bash
# scripts/data/reset_db.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "⚠️  DANGER: This will DESTROY all data in the database."
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "💥 Resetting database..."
docker compose down -v
docker compose up -d postgres
echo "⏳ Waiting for postgres to be ready..."
sleep 5
# Run migrations
docker compose exec backend alembic upgrade head

echo "✅ Database reset and migrations applied."
