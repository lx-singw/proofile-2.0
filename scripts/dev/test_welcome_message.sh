#!/bin/bash
set -e

EMAIL="welcome_test_$(date +%s)@example.com"
PASSWORD="TestPass1!"

echo "1. Registering user: $EMAIL"
docker compose exec backend curl -s -X POST http://localhost:8000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Welcome Test\",\"role\":\"apprentice\"}" > /dev/null

echo -e "\n\n2. Logging in..."
TOKEN_RESPONSE=$(docker compose exec backend curl -s -X POST http://localhost:8000/api/v1/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "Token obtained."

echo -e "\n3. Checking User Profile for created_at..."
USER_PROFILE=$(docker compose exec backend curl -s -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN")

echo "User Profile:"
echo $USER_PROFILE

if echo "$USER_PROFILE" | grep -q '"created_at":"20'; then
  echo "SUCCESS: created_at field found and looks like a date."
else
  echo "FAILURE: created_at field missing or invalid."
  exit 1
fi
