#!/bin/sh
set -e

# Wait for Postgres to be ready
until pg_isready -h postgres -U proofile_user -d proofile_dev; do
  echo "Waiting for postgres..."
  sleep 2
 done

# Run Alembic migrations
alembic upgrade head

# Start the backend app
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
