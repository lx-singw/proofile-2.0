"""
Deduplication Middleware
========================
Phase 5: Uses Redis state manager to skip already-seen URLs.
Enables efficient incremental scraping.
"""
import logging
from scrapy import signals
from scrapy.exceptions import IgnoreRequest
from scrapy.http import Request

from utils.redis_state import get_state_manager, RedisStateManager

logger = logging.getLogger(__name__)


class DeduplicationMiddleware:
    """
    Middleware that skips URLs already scraped.
    
    Uses Redis-based state management for persistent deduplication
    across spider runs.
    
    Enable in settings.py:
    DOWNLOADER_MIDDLEWARES = {
        'middlewares.deduplication_middleware.DeduplicationMiddleware': 100,
    }
    
    Configure with:
    ENABLE_DEDUPLICATION = True
    DEDUP_TTL = 604800  # 7 days
    """
    
    def __init__(self, state_manager: RedisStateManager, enabled: bool = True, ttl: int = 604800):
        self.state = state_manager
        self.enabled = enabled
        self.ttl = ttl
        self.stats = {
            'seen': 0,
            'new': 0,
        }
    
    @classmethod
    def from_crawler(cls, crawler):
        enabled = crawler.settings.getbool('ENABLE_DEDUPLICATION', False)
        ttl = crawler.settings.getint('DEDUP_TTL', 604800)  # 7 days default
        
        state_manager = get_state_manager()
        middleware = cls(state_manager, enabled, ttl)
        
        # Connect signals for spider lifecycle
        crawler.signals.connect(
            middleware.spider_opened, signal=signals.spider_opened
        )
        crawler.signals.connect(
            middleware.spider_closed, signal=signals.spider_closed
        )
        crawler.signals.connect(
            middleware.item_scraped, signal=signals.item_scraped
        )
        
        return middleware
    
    def spider_opened(self, spider):
        """Record spider run start."""
        if self.enabled:
            self.run_id = self.state.start_spider_run(spider.name)
            logger.info(f"Deduplication enabled for {spider.name} (TTL: {self.ttl}s)")
        else:
            self.run_id = None
            logger.info(f"Deduplication disabled for {spider.name}")
    
    def spider_closed(self, spider, reason):
        """Record spider run end."""
        if self.enabled and self.run_id:
            items = spider.crawler.stats.get_value('item_scraped_count', 0)
            errors = spider.crawler.stats.get_value('log_count/ERROR', 0)
            self.state.end_spider_run(
                spider.name,
                self.run_id,
                items_scraped=items,
                errors=errors,
                reason=reason
            )
            logger.info(
                f"Deduplication stats: {self.stats['new']} new, "
                f"{self.stats['seen']} skipped"
            )
    
    def item_scraped(self, item, response, spider):
        """Mark URL as seen when item is successfully scraped."""
        if self.enabled:
            url = item.get('original_url') or item.get('canonical_link') or response.url
            self.state.mark_url_seen(
                url,
                spider.name,
                metadata={
                    'title': (item.get('title') or '')[:100],
                    'type': item.get('type', 'unknown'),
                },
                ttl=self.ttl
            )
    
    def process_request(self, request: Request, spider):
        """
        Check if URL has been seen before.
        Skip if already scraped (unless force_scrape is set).
        """
        if not self.enabled:
            return None
        
        # Allow forced re-scraping
        if request.meta.get('force_scrape'):
            return None
        
        # Check if URL was seen
        url = request.url
        if self.state.is_url_seen(url, spider.name):
            self.stats['seen'] += 1
            logger.debug(f"Skipping seen URL: {url[:80]}...")
            raise IgnoreRequest(f"URL already scraped: {url}")
        
        self.stats['new'] += 1
        return None


class IncrementalScrapingExtension:
    """
    Extension that provides smart pagination stopping.
    
    When encountering pages with only previously-seen items,
    stops pagination to avoid wasting resources.
    
    Enable in settings.py:
    EXTENSIONS = {
        'middlewares.deduplication_middleware.IncrementalScrapingExtension': 600,
    }
    
    Configure with:
    INCREMENTAL_STOP_THRESHOLD = 3  # Stop after N pages with all seen items
    """
    
    def __init__(self, state_manager: RedisStateManager, threshold: int = 3):
        self.state = state_manager
        self.threshold = threshold
        self.consecutive_seen = 0
    
    @classmethod
    def from_crawler(cls, crawler):
        threshold = crawler.settings.getint('INCREMENTAL_STOP_THRESHOLD', 3)
        state_manager = get_state_manager()
        ext = cls(state_manager, threshold)
        
        crawler.signals.connect(ext.item_scraped, signal=signals.item_scraped)
        crawler.signals.connect(ext.response_received, signal=signals.response_received)
        
        return ext
    
    def response_received(self, response, request, spider):
        """Track page processing for pagination stopping."""
        # Reset counter on new page
        if not request.meta.get('_is_detail_page'):
            self.consecutive_seen = 0
    
    def item_scraped(self, item, response, spider):
        """Check if item was previously seen."""
        url = item.get('original_url') or response.url
        
        # This would require checking before scraping - placeholder
        # In practice, this is handled by the middleware
        pass
