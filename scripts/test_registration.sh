#!/bin/bash
EMAIL="test_$(date +%s)@example.com"
echo "Registering user with email: $EMAIL"
curl -s -X POST http://localhost:8000/api/v1/users \
-H 'Content-Type: application/json' \
-d "{\"email\":\"$EMAIL\",\"password\":\"TestPass1!\",\"full_name\":\"Test User\",\"role\":\"apprentice\"}"
