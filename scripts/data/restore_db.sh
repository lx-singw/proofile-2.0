#!/bin/bash
# scripts/data/restore_db.sh

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file_path>"
  exit 1
fi

BACKUP_FILE="$1"

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database."
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "🔄 Restoring database from $BACKUP_FILE..."
cat "$BACKUP_FILE" | docker compose exec -T postgres psql -U proofile_user -d proofile_dev

if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully"
else
  echo "❌ Restore failed"
  exit 1
fi
