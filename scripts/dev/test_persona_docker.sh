#!/bin/bash
set -e

EMAIL="docker_test_$(date +%s)@example.com"
PASSWORD="TestPass1!"

echo "1. Registering user: $EMAIL"
docker compose exec backend curl -s -X POST http://localhost:8000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Docker Test\",\"role\":\"apprentice\"}" > /dev/null

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

echo -e "\n3. Initial User State:"
docker compose exec backend curl -s -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo -e "\n4. Updating Persona to 'graduate'..."
UPDATE_RESPONSE=$(docker compose exec backend curl -s -X PATCH http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"persona": "graduate"}')

echo "Update Response:"
echo $UPDATE_RESPONSE

echo -e "\n5. Verifying User State after update:"
docker compose exec backend curl -s -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
echo ""
