"""
Redis-based Incremental Scraping Utilities
==========================================
Phase 5: Implements URL deduplication and spider state management.
Enables smart incremental scraping to avoid re-processing seen URLs.
"""
import hashlib
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Try to import redis, provide fallback
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None


class RedisStateManager:
    """
    Manages spider state and URL deduplication using Redis.
    
    Features:
    - URL fingerprint-based deduplication
    - Spider run state tracking
    - TTL-based expiration for old entries
    - Batch operations for efficiency
    """
    
    def __init__(
        self,
        redis_url: str = None,
        prefix: str = "scraper",
        default_ttl: int = 7 * 24 * 3600,  # 7 days
    ):
        """
        Initialize Redis state manager.
        
        Args:
            redis_url: Redis connection URL
            prefix: Key prefix for all Redis keys
            default_ttl: Default TTL for entries in seconds
        """
        self.prefix = prefix
        self.default_ttl = default_ttl
        self.client = None
        
        if REDIS_AVAILABLE and redis_url:
            try:
                self.client = redis.from_url(redis_url)
                self.client.ping()
                logger.info(f"Redis connected: {redis_url}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Using fallback mode.")
                self.client = None
        else:
            if not REDIS_AVAILABLE:
                logger.warning("redis package not installed. Using fallback mode.")
            else:
                logger.warning("No Redis URL provided. Using fallback mode.")
        
        # Fallback in-memory cache when Redis unavailable
        self._memory_cache: Dict[str, Any] = {}
    
    def _key(self, *parts) -> str:
        """Generate Redis key with prefix."""
        return f"{self.prefix}:{':'.join(parts)}"
    
    @staticmethod
    def _fingerprint(url: str) -> str:
        """
        Generate URL fingerprint for deduplication.
        Normalizes URL and creates hash.
        """
        parsed = urlparse(url)
        # Normalize: remove fragment, lowercase domain
        normalized = f"{parsed.scheme}://{parsed.netloc.lower()}{parsed.path}"
        if parsed.query:
            normalized += f"?{parsed.query}"
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]
    
    # =========================================================================
    # URL Deduplication
    # =========================================================================
    
    def is_url_seen(self, url: str, spider_name: str) -> bool:
        """
        Check if URL has been seen by spider.
        
        Args:
            url: URL to check
            spider_name: Spider identifier
            
        Returns:
            True if URL was previously scraped
        """
        fp = self._fingerprint(url)
        key = self._key(spider_name, "urls", fp)
        
        if self.client:
            return self.client.exists(key) > 0
        else:
            return key in self._memory_cache
    
    def mark_url_seen(
        self,
        url: str,
        spider_name: str,
        metadata: Optional[dict] = None,
        ttl: Optional[int] = None
    ):
        """
        Mark URL as seen by spider.
        
        Args:
            url: URL to mark
            spider_name: Spider identifier
            metadata: Optional metadata to store
            ttl: Optional custom TTL
        """
        fp = self._fingerprint(url)
        key = self._key(spider_name, "urls", fp)
        ttl = ttl or self.default_ttl
        
        data = {
            'url': url,
            'fingerprint': fp,
            'seen_at': datetime.utcnow().isoformat(),
            **(metadata or {})
        }
        
        if self.client:
            self.client.setex(key, ttl, json.dumps(data))
        else:
            self._memory_cache[key] = data
    
    def mark_urls_batch(
        self,
        urls: List[str],
        spider_name: str,
        ttl: Optional[int] = None
    ):
        """
        Mark multiple URLs as seen (batch operation).
        
        Args:
            urls: List of URLs to mark
            spider_name: Spider identifier
            ttl: Optional custom TTL
        """
        ttl = ttl or self.default_ttl
        now = datetime.utcnow().isoformat()
        
        if self.client:
            pipe = self.client.pipeline()
            for url in urls:
                fp = self._fingerprint(url)
                key = self._key(spider_name, "urls", fp)
                data = json.dumps({
                    'url': url,
                    'fingerprint': fp,
                    'seen_at': now
                })
                pipe.setex(key, ttl, data)
            pipe.execute()
        else:
            for url in urls:
                self.mark_url_seen(url, spider_name)
    
    def get_unseen_urls(self, urls: List[str], spider_name: str) -> List[str]:
        """
        Filter list to only unseen URLs.
        
        Args:
            urls: List of URLs to filter
            spider_name: Spider identifier
            
        Returns:
            List of URLs not previously seen
        """
        unseen = []
        for url in urls:
            if not self.is_url_seen(url, spider_name):
                unseen.append(url)
        return unseen
    
    # =========================================================================
    # Spider Run State
    # =========================================================================
    
    def start_spider_run(self, spider_name: str) -> str:
        """
        Record start of spider run.
        
        Args:
            spider_name: Spider identifier
            
        Returns:
            Run ID
        """
        run_id = f"{spider_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        key = self._key(spider_name, "runs", run_id)
        
        data = {
            'run_id': run_id,
            'spider': spider_name,
            'started_at': datetime.utcnow().isoformat(),
            'status': 'running',
            'items_scraped': 0,
            'errors': 0,
        }
        
        if self.client:
            self.client.setex(key, self.default_ttl, json.dumps(data))
            # Also set current run pointer
            self.client.set(self._key(spider_name, "current_run"), run_id)
        else:
            self._memory_cache[key] = data
        
        logger.info(f"Spider run started: {run_id}")
        return run_id
    
    def update_spider_run(
        self,
        spider_name: str,
        run_id: str,
        items_scraped: int = 0,
        errors: int = 0,
        **kwargs
    ):
        """
        Update spider run statistics.
        
        Args:
            spider_name: Spider identifier
            run_id: Run ID
            items_scraped: Number of items scraped
            errors: Number of errors encountered
            **kwargs: Additional stats to update
        """
        key = self._key(spider_name, "runs", run_id)
        
        if self.client:
            data_str = self.client.get(key)
            if data_str:
                data = json.loads(data_str)
                data['items_scraped'] = items_scraped
                data['errors'] = errors
                data.update(kwargs)
                self.client.setex(key, self.default_ttl, json.dumps(data))
        else:
            if key in self._memory_cache:
                self._memory_cache[key].update({
                    'items_scraped': items_scraped,
                    'errors': errors,
                    **kwargs
                })
    
    def end_spider_run(
        self,
        spider_name: str,
        run_id: str,
        items_scraped: int,
        errors: int,
        reason: str = 'finished'
    ):
        """
        Record end of spider run.
        
        Args:
            spider_name: Spider identifier
            run_id: Run ID
            items_scraped: Total items scraped
            errors: Total errors
            reason: Close reason
        """
        key = self._key(spider_name, "runs", run_id)
        
        if self.client:
            data_str = self.client.get(key)
            if data_str:
                data = json.loads(data_str)
                data['status'] = 'finished'
                data['finished_at'] = datetime.utcnow().isoformat()
                data['items_scraped'] = items_scraped
                data['errors'] = errors
                data['reason'] = reason
                self.client.setex(key, self.default_ttl, json.dumps(data))
        else:
            if key in self._memory_cache:
                self._memory_cache[key].update({
                    'status': 'finished',
                    'finished_at': datetime.utcnow().isoformat(),
                    'items_scraped': items_scraped,
                    'errors': errors,
                    'reason': reason
                })
        
        logger.info(f"Spider run ended: {run_id} - {items_scraped} items, {errors} errors")
    
    def get_last_run(self, spider_name: str) -> Optional[dict]:
        """
        Get information about the last spider run.
        
        Args:
            spider_name: Spider identifier
            
        Returns:
            Last run info or None
        """
        if self.client:
            run_id = self.client.get(self._key(spider_name, "current_run"))
            if run_id:
                data_str = self.client.get(self._key(spider_name, "runs", run_id.decode()))
                if data_str:
                    return json.loads(data_str)
        return None
    
    # =========================================================================
    # Content Fingerprinting
    # =========================================================================
    
    def get_content_hash(self, content: str) -> str:
        """Generate hash of content for change detection."""
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def has_content_changed(
        self,
        url: str,
        content: str,
        spider_name: str
    ) -> bool:
        """
        Check if content at URL has changed since last scrape.
        
        Args:
            url: URL of content
            content: Current content (will be hashed)
            spider_name: Spider identifier
            
        Returns:
            True if content is new or changed
        """
        fp = self._fingerprint(url)
        key = self._key(spider_name, "content", fp)
        new_hash = self.get_content_hash(content)
        
        if self.client:
            old_hash = self.client.get(key)
            if old_hash:
                return old_hash.decode() != new_hash
            return True  # Never seen
        else:
            old_hash = self._memory_cache.get(key)
            return old_hash != new_hash if old_hash else True
    
    def store_content_hash(
        self,
        url: str,
        content: str,
        spider_name: str,
        ttl: Optional[int] = None
    ):
        """
        Store content hash for future comparison.
        
        Args:
            url: URL of content
            content: Content to hash and store
            spider_name: Spider identifier
            ttl: Optional custom TTL
        """
        fp = self._fingerprint(url)
        key = self._key(spider_name, "content", fp)
        content_hash = self.get_content_hash(content)
        ttl = ttl or self.default_ttl
        
        if self.client:
            self.client.setex(key, ttl, content_hash)
        else:
            self._memory_cache[key] = content_hash
    
    # =========================================================================
    # Pagination State
    # =========================================================================
    
    def save_pagination_state(
        self,
        spider_name: str,
        category: str,
        last_page: int,
        last_url: str
    ):
        """
        Save pagination state for resuming scrapes.
        
        Args:
            spider_name: Spider identifier
            category: Category/section being scraped
            last_page: Last page number processed
            last_url: Last URL processed
        """
        key = self._key(spider_name, "pagination", category)
        data = {
            'last_page': last_page,
            'last_url': last_url,
            'saved_at': datetime.utcnow().isoformat()
        }
        
        if self.client:
            self.client.setex(key, self.default_ttl, json.dumps(data))
        else:
            self._memory_cache[key] = data
    
    def get_pagination_state(
        self,
        spider_name: str,
        category: str
    ) -> Optional[dict]:
        """
        Get saved pagination state.
        
        Args:
            spider_name: Spider identifier
            category: Category/section
            
        Returns:
            Pagination state or None
        """
        key = self._key(spider_name, "pagination", category)
        
        if self.client:
            data_str = self.client.get(key)
            if data_str:
                return json.loads(data_str)
        else:
            return self._memory_cache.get(key)
        return None


# Global state manager instance
def get_state_manager() -> RedisStateManager:
    """Get or create global state manager."""
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/1")
    return RedisStateManager(redis_url=redis_url)
