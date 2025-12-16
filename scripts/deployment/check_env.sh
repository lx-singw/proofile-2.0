#!/bin/bash
# scripts/deployment/check_env.sh

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

REQUIRED_VARS=(
  "POSTGRES_USER"
  "POSTGRES_PASSWORD"
  "POSTGRES_DB"
  "SECRET_KEY"
  # Add other required vars
)

MISSING=0

if [ -f .env ]; then
  echo "📄 Loading .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️  .env file not found."
fi

echo "🔍 Checking environment variables..."

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    MISSING=1
  else
    echo "✅ Found: $var"
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "❌ Environment check failed."
  exit 1
else
  echo "✅ Environment check passed."
fi
