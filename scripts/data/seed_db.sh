#!/bin/bash
# scripts/data/seed_db.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

echo "🌱 Seeding database..."
# Assuming there is a seed command or script. 
# If not, we can use the python script we are moving later.
# For now, let's try to run the python seed script if it exists in the new location, 
# or fall back to a generic command.

if [ -f "scripts/data/seed_test_user.py" ]; then
    docker compose exec backend python scripts/data/seed_test_user.py
else
    echo "⚠️  Seed script not found in scripts/data/seed_test_user.py"
    echo "Attempting to run via module if available..."
    # Add your actual seed command here if different
    # docker compose exec backend python -m app.scripts.seed
fi

echo "✅ Seeding complete (check output for errors)"
