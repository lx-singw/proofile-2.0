import os
import random
from dotenv import load_dotenv

load_dotenv()

BOT_NAME = "sa_search_engine"

SPIDER_MODULES = ["spiders"]
NEWSPIDER_MODULE = "spiders"

# Crawl responsibly by identifying yourself
USER_AGENT = "SA Search Engine Intelligence Bot (+https://sasearchengine.co.za)"

# Job-listings aggregator — scraping public data; robots.txt not enforced
ROBOTSTXT_OBEY = False

# ============================================================================
# REQUEST CONFIGURATION - Quick Win: Retry Logic
# ============================================================================

# Configure maximum concurrent requests
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 2  # Be polite to individual sites

# Configure a delay for requests for the same website
DOWNLOAD_DELAY = 2  # Increased for better stealth
RANDOMIZE_DOWNLOAD_DELAY = True  # Random delay between 0.5x and 1.5x

# Download timeout
DOWNLOAD_TIMEOUT = 30  # 30 seconds timeout

# Retry configuration - Quick Win Day 1
RETRY_ENABLED = True
RETRY_TIMES = 3  # Retry up to 3 times
RETRY_HTTP_CODES = [500, 502, 503, 504, 520, 521, 522, 523, 524, 408, 429]
RETRY_PRIORITY_ADJUST = -1  # Lower priority for retries

# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# Disable cookies (enabled by default)
COOKIES_ENABLED = False

# Enable or disable downloader middlewares
DOWNLOADER_MIDDLEWARES = {
    "middlewares.proxy_middleware.ProxyMiddleware": 400,
    "middlewares.user_agent_middleware.RandomUserAgentMiddleware": 500,
    "scrapy.downloadermiddlewares.retry.RetryMiddleware": 550,
}

# ============================================================================
# PROXY CONFIGURATION (Required for Indeed)
# ============================================================================
# To enable residential proxies (e.g. BrightData, Smartproxy), set these env vars:
# PROXY_ENABLED=true
# PROXY_URL=http://user:pass@host:port
#
# Indeed requires High-Reputation Residential IPs to bypass 403 blocks.
# The ProxyMiddleware at priority 400 will handle this if PROXY_ENABLED=true.

# ============================================================================
# PIPELINE CONFIGURATION
# ============================================================================

ITEM_PIPELINES = {
    "pipelines.link_validation_pipeline.LinkValidationPipeline": 200,
    "pipelines.metrics_pipeline.ConfidenceScoringPipeline": 250,  # Add confidence score
    "pipelines.metrics_pipeline.ExtractionMetricsPipeline": 280,  # Log metrics
    "pipelines.queue_pipeline.QueuePipeline": 300,
}

# ============================================================================
# EXPORT CONFIGURATION
# ============================================================================

# Export to JSON for local debugging
FEEDS = {
    'items.json': {
        'format': 'json',
        'encoding': 'utf8',
        'store_empty': False,
        'indent': 2,
        'overwrite': True,
    },
}

# ============================================================================
# EXTERNAL SERVICES
# ============================================================================

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

# ============================================================================
# LOGGING CONFIGURATION - Enhanced for monitoring
# ============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"

# ============================================================================
# AUTOTHROTTLE - Adaptive crawling
# ============================================================================

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0
AUTOTHROTTLE_DEBUG = False

# ============================================================================
# EXTENSIONS - Phase 1: Monitoring
# ============================================================================

EXTENSIONS = {
    "extensions.prometheus_metrics.PrometheusMetricsExtension": 500,
}

# Prometheus metrics server port
PROMETHEUS_PORT = int(os.getenv("PROMETHEUS_PORT", 9100))

# ============================================================================
# ASYNC LINK VALIDATION - Phase 1
# ============================================================================

# Enable async link validation in pipeline
ENABLE_LINK_VALIDATION = os.getenv("ENABLE_LINK_VALIDATION", "false").lower() == "true"
LINK_VALIDATION_TIMEOUT = int(os.getenv("LINK_VALIDATION_TIMEOUT", 10))
LINK_VALIDATION_CONCURRENCY = int(os.getenv("LINK_VALIDATION_CONCURRENCY", 10))
