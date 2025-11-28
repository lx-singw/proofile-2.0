#!/bin/bash

# Test persona update endpoint

# 1. Login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPass1!")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token obtained."

# 2. Update persona
echo "Updating persona to 'student'..."
curl -v -X PATCH http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"persona":"student"}'

# 3. Verify update
echo "Fetching user to verify..."
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
