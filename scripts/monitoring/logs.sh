#!/bin/bash
# scripts/monitoring/logs.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

SERVICE=${1:-all}

if [ "$SERVICE" == "all" ]; then
  echo "📜 Tailing all logs..."
  docker compose logs -f
else
  echo "📜 Tailing logs for $SERVICE..."
  docker compose logs -f $SERVICE
fi
