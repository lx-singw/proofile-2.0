#!/bin/bash
# scripts/monitoring/check_health.sh

echo "🏥 Checking Health..."

echo -n "Backend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health
echo ""

echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
echo ""

# Add more checks as needed
