#!/bin/bash
# Test script for structured requirements extraction

echo "=== Testing Capitec Service Consultant Scraping ===" 
echo "URL: https://www.studentroom.co.za/capitec-bank-is-hiring-service-consultant-3/"
echo ""

# Run scraper with hardcoded URL
docker-compose run --rm scraper scrapy crawl studentroom \
  -a start_urls=https://www.studentroom.co.za/capitec-bank-is-hiring-service-consultant-3/ \
  -a max_pages=1 \
  -o /tmp/test_capitec.json

echo ""
echo "=== Checking Results ===" 

# View the scraped JSON
docker-compose run --rm scraper cat /tmp/test_capitec.json | python3 -m json.tool > /tmp/test_capitec_formatted.json

echo "Checking for key fields..."

# Check if structured_requirements was extracted
echo -n "✓ Structured requirements: "
docker-compose run --rm scraper python3 -c "
import json
with open('/tmp/test_capitec.json') as f:
  
