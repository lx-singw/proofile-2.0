"""
Dead Letter Queue Consumer
==========================
Processes failed items from the DLQ with exponential backoff retry.
Items that fail MAX_DLQ_RETRIES times are moved to a permanent failed queue
for manual inspection.

Run: python -m queue_consumers.dlq_consumer
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any

import redis.asyncio as aioredis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MAX_DLQ_RETRIES = int(os.getenv("MAX_DLQ_RETRIES", "5"))
BASE_BACKOFF_SECONDS = int(os.getenv("DLQ_BASE_BACKOFF", "60"))
MAX_BACKOFF_SECONDS = int(os.getenv("DLQ_MAX_BACKOFF", "3600"))
DLQ_CHECK_INTERVAL = int(os.getenv("DLQ_CHECK_INTERVAL", "30"))

# Redis Keys
DLQ_NAME = "raw_opportunities:dlq"
MAIN_QUEUE = "raw_opportunities"
PERMANENT_FAILED_QUEUE = "raw_opportunities:permanent_failed"
DLQ_STATS_KEY = "stats:dlq"


class DLQConsumer:
    """
    Consumes items from the dead letter queue with exponential backoff.
    
    Strategy:
    1. Pop item from DLQ
    2. Check retry count
    3. If retries < MAX_DLQ_RETRIES:
       - Calculate backoff delay
       - If delay has passed, push back to main queue
       - Otherwise, re-add to DLQ (will be checked again later)
    4. If retries >= MAX_DLQ_RETRIES:
       - Move to permanent failed queue for manual inspection
    """
    
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)
        self.stats = {
            "requeued": 0,
            "permanent_failed": 0,
            "waiting_backoff": 0,
        }
    
    def _calculate_backoff(self, retry_count: int) -> int:
        """Calculate exponential backoff delay in seconds."""
        delay = BASE_BACKOFF_SECONDS * (2 ** retry_count)
        return min(delay, MAX_BACKOFF_SECONDS)
    
    def _should_retry(self, item: dict) -> tuple[bool, int]:
        """
        Determine if item should be retried.
        Returns (should_retry, wait_seconds).
        """
        retry_count = item.get("_dlq_retry_count", 0)
        
        if retry_count >= MAX_DLQ_RETRIES:
            return False, 0
        
        # Check if backoff has passed
        last_failed_at = item.get("_dlq_last_failed_at")
        if last_failed_at:
            try:
                failed_time = datetime.fromisoformat(last_failed_at)
                backoff_seconds = self._calculate_backoff(retry_count)
                retry_after = failed_time + timedelta(seconds=backoff_seconds)
                
                if datetime.utcnow() < retry_after:
                    wait_seconds = int((retry_after - datetime.utcnow()).total_seconds())
                    return True, wait_seconds
            except (ValueError, TypeError):
                pass
        
        return True, 0
    
    async def process_dlq_item(self, raw_data: bytes) -> None:
        """Process a single DLQ item."""
        try:
            item = json.loads(raw_data)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in DLQ, discarding")
            return
        
        item_id = item.get("original_url", "unknown")[:50]
        should_retry, wait_seconds = self._should_retry(item)
        
        if not should_retry:
            # Move to permanent failed queue
            logger.warning(f"[DLQ] Item exhausted retries, moving to permanent failed: {item_id}")
            await self.redis.lpush(PERMANENT_FAILED_QUEUE, json.dumps(item))
            self.stats["permanent_failed"] += 1
            await self.redis.hset(DLQ_STATS_KEY, "permanent_failed", self.stats["permanent_failed"])
            return
        
        if wait_seconds > 0:
            # Still in backoff, re-add to DLQ
            logger.debug(f"[DLQ] Item waiting backoff ({wait_seconds}s): {item_id}")
            await self.redis.rpush(DLQ_NAME, json.dumps(item))
            self.stats["waiting_backoff"] += 1
            return
        
        # Ready to retry - increment counter and push to main queue
        item["_dlq_retry_count"] = item.get("_dlq_retry_count", 0) + 1
        item["_dlq_last_retry_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"[DLQ] Requeuing item (attempt {item['_dlq_retry_count']}): {item_id}")
        await self.redis.lpush(MAIN_QUEUE, json.dumps(item))
        self.stats["requeued"] += 1
        await self.redis.hset(DLQ_STATS_KEY, "requeued", self.stats["requeued"])
    
    async def get_dlq_stats(self) -> dict[str, Any]:
        """Get DLQ statistics."""
        dlq_size = await self.redis.llen(DLQ_NAME)
        permanent_failed_size = await self.redis.llen(PERMANENT_FAILED_QUEUE)
        
        return {
            "dlq_size": dlq_size,
            "permanent_failed_size": permanent_failed_size,
            "session_requeued": self.stats["requeued"],
            "session_permanent_failed": self.stats["permanent_failed"],
        }
    
    async def start_consuming(self) -> None:
        """Main consumer loop."""
        logger.info(f"Starting DLQ consumer (max_retries={MAX_DLQ_RETRIES}, base_backoff={BASE_BACKOFF_SECONDS}s)")
        
        while True:
            try:
                # Non-blocking pop with timeout
                result = await self.redis.brpop(DLQ_NAME, timeout=DLQ_CHECK_INTERVAL)
                
                if result:
                    _, data = result
                    await self.process_dlq_item(data)
                else:
                    # No items in DLQ, log stats periodically
                    stats = await self.get_dlq_stats()
                    if stats["dlq_size"] > 0 or stats["permanent_failed_size"] > 0:
                        logger.info(f"[DLQ Stats] {stats}")
                        
            except Exception as e:
                logger.error(f"Error in DLQ consumer: {e}", exc_info=True)
                await asyncio.sleep(5)


async def main():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/1")
    consumer = DLQConsumer(redis_url)
    await consumer.start_consuming()


if __name__ == "__main__":
    asyncio.run(main())
