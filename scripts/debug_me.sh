#!/bin/bash
# Register a new user
EMAIL="debug_$(date +%s)@example.com"
PASSWORD="TestPass1!"
echo "Registering user: $EMAIL"
curl -s -X POST http://localhost:8000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Debug User\",\"role\":\"apprentice\"}" > /dev/null

# Login to get token
echo "Logging in..."
TOKEN_RESP=$(curl -s -X POST http://localhost:8000/api/v1/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo $TOKEN_RESP | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed: $TOKEN_RESP"
  exit 1
fi

echo "Got token: $TOKEN"

# Call GET /api/v1/users/me
echo "Calling GET /api/v1/users/me..."
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/users/me
