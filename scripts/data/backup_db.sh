#!/bin/bash
# scripts/data/backup_db.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./data/backups"
mkdir -p "$BACKUP_DIR"

echo "📦 Backing up database..."
docker compose exec -T postgres pg_dump -U proofile_user proofile_dev > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
  echo "✅ Backup created at $BACKUP_DIR/backup_$TIMESTAMP.sql"
else
  echo "❌ Backup failed"
  exit 1
fi
