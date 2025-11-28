#!/bin/bash
set -e

EMAIL="repro_$(date +%s)@example.com"
PASSWORD="TestPass1!"

echo "1. Registering user: $EMAIL"
curl -s -X POST http://localhost:8000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Repro User\",\"role\":\"apprentice\"}" > /dev/null

echo -e "\n\n2. Logging in..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "Token obtained."

echo -e "\n3. Calling /api/v1/users/me..."
HTTP_CODE=$(curl -s -o response.json -w "%{http_code}" -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN")

echo "HTTP Code: $HTTP_CODE"
cat response.json
echo ""

if [ "$HTTP_CODE" == "500" ]; then
  echo "Reproduced 500 error!"
else
  echo "Did not reproduce 500 error."
fi
