"""
Optimized Queue Pipeline
========================
Phase 4: High-performance Redis queue pipeline with:
- Batch operations (reduces network round-trips)
- Connection pooling
- Memory-efficient item processing
- Automatic retry on connection failures
"""
import json
import logging
import os
from typing import List, Dict, Any
from datetime import datetime

import redis
from redis.connection import ConnectionPool
from scrapy import signals
from scrapy.exceptions import DropItem

logger = logging.getLogger(__name__)


class OptimizedQueuePipeline:
    """
    High-performance pipeline that batches items before pushing to Redis.
    
    Features:
    - Batches items (default 50) before pushing
    - Uses connection pooling
    - Graceful flush on spider close
    - Automatic retry on failures
    
    Enable in settings.py:
    ITEM_PIPELINES = {
        'pipelines.optimized_queue_pipeline.OptimizedQueuePipeline': 800,
    }
    
    Configure with:
    REDIS_URL = 'redis://localhost:6379/1'
    REDIS_QUEUE_NAME = 'raw_opportunities'
    REDIS_BATCH_SIZE = 50
    """
    
    def __init__(
        self,
        redis_url: str,
        queue_name: str = 'raw_opportunities',
        batch_size: int = 50,
    ):
        self.redis_url = redis_url
        self.queue_name = queue_name
        self.batch_size = batch_size
        self.buffer: List[Dict[str, Any]] = []
        self.pool = None
        self.client = None
        
        # Stats
        self.items_queued = 0
        self.batches_pushed = 0
        self.push_errors = 0
    
    @classmethod
    def from_crawler(cls, crawler):
        pipeline = cls(
            redis_url=crawler.settings.get('REDIS_URL', 'redis://redis:6379/1'),
            queue_name=crawler.settings.get('REDIS_QUEUE_NAME', 'raw_opportunities'),
            batch_size=crawler.settings.getint('REDIS_BATCH_SIZE', 50),
        )
        
        # Connect signals
        crawler.signals.connect(pipeline.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(pipeline.spider_closed, signal=signals.spider_closed)
        
        return pipeline
    
    def spider_opened(self, spider):
        """Initialize Redis connection pool."""
        try:
            self.pool = ConnectionPool.from_url(
                self.redis_url,
                max_connections=10,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
            )
            self.client = redis.Redis(connection_pool=self.pool)
            self.client.ping()
            logger.info(f"Redis connection pool initialized for {spider.name}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # Fallback to standard connection
            self.client = redis.from_url(self.redis_url)
    
    def spider_closed(self, spider, reason):
        """Flush remaining items and close connections."""
        # Flush any remaining items
        if self.buffer:
            self._flush_buffer(spider)
        
        # Log stats
        logger.info(
            f"Queue pipeline stats: {self.items_queued} items queued, "
            f"{self.batches_pushed} batches, {self.push_errors} errors"
        )
        
        # Close pool
        if self.pool:
            self.pool.disconnect()
    
    def process_item(self, item, spider):
        """Add item to buffer, flush when batch size reached."""
        # Validate required fields
        if not item.get('title') or not item.get('original_url'):
            raise DropItem("Missing mandatory fields (title or original_url)")
        
        # Prepare item for queue
        queue_item = self._prepare_item(item, spider)
        self.buffer.append(queue_item)
        
        # Flush if batch size reached
        if len(self.buffer) >= self.batch_size:
            self._flush_buffer(spider)
        
        return item
    
    def _prepare_item(self, item: Dict, spider) -> Dict:
        """Prepare item for Redis queue with metadata."""
        queue_item = dict(item)
        
        # Add metadata
        queue_item['spider'] = spider.name
        queue_item['scraped_at'] = datetime.utcnow().isoformat()
        queue_item['batch_id'] = f"{spider.name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Ensure all values are JSON serializable
        for key, value in list(queue_item.items()):
            if hasattr(value, '__iter__') and not isinstance(value, (str, list, dict)):
                queue_item[key] = list(value)
        
        return queue_item
    
    def _flush_buffer(self, spider):
        """Push buffered items to Redis in a single operation."""
        if not self.buffer:
            return
        
        try:
            # Use pipeline for atomic batch push
            pipe = self.client.pipeline()
            for item in self.buffer:
                pipe.lpush(self.queue_name, json.dumps(item))
            pipe.execute()
            
            count = len(self.buffer)
            self.items_queued += count
            self.batches_pushed += 1
            
            logger.debug(f"Flushed {count} items to Redis queue")
            self.buffer = []
            
        except redis.RedisError as e:
            self.push_errors += 1
            logger.error(f"Redis push failed: {e}")
            
            # Retry individual items
            self._retry_items(spider)
    
    def _retry_items(self, spider):
        """Retry pushing items individually on batch failure."""
        saved = 0
        failed = []
        
        for item in self.buffer:
            try:
                self.client.lpush(self.queue_name, json.dumps(item))
                saved += 1
            except redis.RedisError:
                failed.append(item)
        
        if saved > 0:
            self.items_queued += saved
            logger.info(f"Recovered {saved} items via individual push")
        
        if failed:
            logger.error(f"Failed to push {len(failed)} items after retry")
        
        self.buffer = []


class LegacyQueuePipeline:
    """
    Original non-batched pipeline for backward compatibility.
    Use OptimizedQueuePipeline for better performance.
    """
    
    def __init__(self, redis_url):
        self.redis_url = redis_url

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            redis_url=crawler.settings.get('REDIS_URL', 'redis://redis:6379/1')
        )

    def open_spider(self, spider):
        self.client = redis.from_url(self.redis_url)

    def process_item(self, item, spider):
        if not item.get('title') or not item.get('original_url'):
            raise DropItem("Missing mandatory fields")
        
        item['spider'] = spider.name
        self.client.lpush('raw_opportunities', json.dumps(dict(item)))
        return item


# Default export for backward compatibility
QueuePipeline = OptimizedQueuePipeline
