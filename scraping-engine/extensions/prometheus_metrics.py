"""
Scrapy Prometheus Metrics Extension
===================================
Phase 1 Foundation: Exposes Scrapy metrics via Prometheus.
Tracks spider performance, extraction quality, and link validation.
"""
import logging
from typing import Dict, Any
from scrapy import signals
from scrapy.crawler import Crawler
from scrapy.statscollectors import StatsCollector

logger = logging.getLogger(__name__)

# Try to import prometheus_client, provide fallback if not available
try:
    from prometheus_client import Counter, Gauge, Histogram, Summary, start_http_server, REGISTRY
    PROMETHEUS_AVAILABLE = True
except ImportError:
    logger.warning("prometheus_client not installed. Metrics will use fallback mode.")
    PROMETHEUS_AVAILABLE = False


class FallbackMetric:
    """Fallback metric class when prometheus_client is not available."""
    def __init__(self, *args, **kwargs):
        self.value = 0
    
    def inc(self, amount=1):
        self.value += amount
    
    def dec(self, amount=1):
        self.value -= amount
    
    def set(self, value):
        self.value = value
    
    def observe(self, value):
        pass
    
    def labels(self, *args, **kwargs):
        return self


# Define metrics (use real Prometheus or fallback)
if PROMETHEUS_AVAILABLE:
    # Spider metrics
    ITEMS_SCRAPED = Counter(
        'scrapy_items_scraped_total',
        'Total items scraped',
        ['spider', 'item_type']
    )
    
    REQUESTS_TOTAL = Counter(
        'scrapy_requests_total',
        'Total requests made',
        ['spider', 'status']
    )
    
    ERRORS_TOTAL = Counter(
        'scrapy_errors_total',
        'Total errors encountered',
        ['spider', 'error_type']
    )
    
    # Link quality metrics
    LINK_QUALITY = Counter(
        'scrapy_link_quality_total',
        'Link quality distribution',
        ['spider', 'quality']
    )
    
    CONFIDENCE_SCORE = Histogram(
        'scrapy_confidence_score',
        'Distribution of confidence scores',
        ['spider'],
        buckets=[0, 20, 40, 60, 80, 100]
    )
    
    # Link validation metrics
    LINKS_VALIDATED = Counter(
        'scrapy_links_validated_total',
        'Total links validated',
        ['spider', 'valid']
    )
    
    LINK_RESPONSE_TIME = Histogram(
        'scrapy_link_response_time_seconds',
        'Link validation response time',
        ['spider'],
        buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
    )
    
    # Performance metrics
    SPIDER_RUNTIME = Gauge(
        'scrapy_spider_runtime_seconds',
        'Spider runtime in seconds',
        ['spider']
    )
    
    ACTIVE_SPIDERS = Gauge(
        'scrapy_active_spiders',
        'Currently active spiders'
    )
    
    ITEMS_PER_MINUTE = Gauge(
        'scrapy_items_per_minute',
        'Current items scraped per minute',
        ['spider']
    )
else:
    # Fallback metrics
    ITEMS_SCRAPED = FallbackMetric()
    REQUESTS_TOTAL = FallbackMetric()
    ERRORS_TOTAL = FallbackMetric()
    LINK_QUALITY = FallbackMetric()
    CONFIDENCE_SCORE = FallbackMetric()
    LINKS_VALIDATED = FallbackMetric()
    LINK_RESPONSE_TIME = FallbackMetric()
    SPIDER_RUNTIME = FallbackMetric()
    ACTIVE_SPIDERS = FallbackMetric()
    ITEMS_PER_MINUTE = FallbackMetric()


class PrometheusMetricsExtension:
    """
    Scrapy extension that exports metrics to Prometheus.
    
    Enable in settings.py:
    EXTENSIONS = {
        'extensions.prometheus_metrics.PrometheusMetricsExtension': 500,
    }
    
    Configure port with:
    PROMETHEUS_PORT = 9100
    """
    
    def __init__(self, stats: StatsCollector, port: int = 9100):
        self.stats = stats
        self.port = port
        self.server_started = False
    
    @classmethod
    def from_crawler(cls, crawler: Crawler):
        port = crawler.settings.getint('PROMETHEUS_PORT', 9100)
        ext = cls(crawler.stats, port)
        
        # Connect signals
        crawler.signals.connect(ext.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(ext.spider_closed, signal=signals.spider_closed)
        crawler.signals.connect(ext.item_scraped, signal=signals.item_scraped)
        crawler.signals.connect(ext.spider_error, signal=signals.spider_error)
        crawler.signals.connect(ext.request_reached_downloader, signal=signals.request_reached_downloader)
        crawler.signals.connect(ext.response_received, signal=signals.response_received)
        
        return ext
    
    def spider_opened(self, spider):
        """Called when spider starts."""
        logger.info(f"Prometheus metrics tracking spider: {spider.name}")
        ACTIVE_SPIDERS.inc()
        
        # Start HTTP server for metrics if not already running
        if PROMETHEUS_AVAILABLE and not self.server_started:
            try:
                start_http_server(self.port)
                self.server_started = True
                logger.info(f"Prometheus metrics server started on port {self.port}")
            except OSError as e:
                logger.warning(f"Could not start Prometheus server: {e}")
    
    def spider_closed(self, spider, reason):
        """Called when spider closes."""
        ACTIVE_SPIDERS.dec()
        
        # Record final stats
        elapsed = self.stats.get_value('elapsed_time_seconds', 0)
        SPIDER_RUNTIME.labels(spider=spider.name).set(elapsed)
        
        items_per_min = self.stats.get_value('items_per_minute', 0)
        ITEMS_PER_MINUTE.labels(spider=spider.name).set(items_per_min)
        
        logger.info(f"Spider {spider.name} closed. Reason: {reason}, Runtime: {elapsed:.1f}s")
    
    def item_scraped(self, item, response, spider):
        """Called when an item is scraped."""
        # Track item by type
        item_type = item.get('type', 'unknown')
        ITEMS_SCRAPED.labels(spider=spider.name, item_type=item_type).inc()
        
        # Track link quality
        link_quality = item.get('link_quality', 'unknown')
        LINK_QUALITY.labels(spider=spider.name, quality=link_quality).inc()
        
        # Track confidence score
        confidence = item.get('confidence_score')
        if confidence is not None:
            CONFIDENCE_SCORE.labels(spider=spider.name).observe(confidence)
    
    def spider_error(self, failure, response, spider):
        """Called when spider encounters an error."""
        error_type = failure.type.__name__ if failure.type else 'Unknown'
        ERRORS_TOTAL.labels(spider=spider.name, error_type=error_type).inc()
    
    def request_reached_downloader(self, request, spider):
        """Called when request is sent."""
        REQUESTS_TOTAL.labels(spider=spider.name, status='sent').inc()
    
    def response_received(self, response, request, spider):
        """Called when response is received."""
        status_class = f'{response.status // 100}xx'
        REQUESTS_TOTAL.labels(spider=spider.name, status=status_class).inc()


def record_link_validation(spider_name: str, valid: bool, response_time_ms: float):
    """
    Record link validation metrics.
    Call this from the validation pipeline.
    """
    LINKS_VALIDATED.labels(spider=spider_name, valid=str(valid).lower()).inc()
    LINK_RESPONSE_TIME.labels(spider=spider_name).observe(response_time_ms / 1000)  # Convert to seconds
