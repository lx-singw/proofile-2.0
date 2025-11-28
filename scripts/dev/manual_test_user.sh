#!/bin/bash
curl -v -X POST http://localhost:8000/api/v1/users \
-H 'Content-Type: application/json' \
-d '{"email":"test@example.com","password":"TestPass1!","full_name":"Test User","role":"apprentice"}'
