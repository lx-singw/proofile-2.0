import json
import redis
import os

redis_url = "redis://redis:6379/1"
r = redis.from_url(redis_url)

test_item = {
    "title": "TEST OPPORTUNITY BY AGENT",
    "description_full": "This is a test opportunity to verify the pipeline enhancements are working with real processing.",
    "original_url": "https://example.com/test-job-" + str(os.getpid()),
    "source_platform": "manual_test",
    "type": "job",
    "raw_data": json.dumps({"test": True})
}

r.lpush('raw_opportunities', json.dumps(test_item))
print(f"Pushed test item to database 1, queue 'raw_opportunities'")
