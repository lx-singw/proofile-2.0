"""
Performance Settings & Utilities
================================
Phase 4: Optimized settings and utilities for high-performance scraping.
"""
import os
from typing import Dict, Any


def get_performance_settings(profile: str = "default") -> Dict[str, Any]:
    """
    Get optimized Scrapy settings based on profile.
    
    Profiles:
    - default: Balanced for typical scraping
    - aggressive: Maximum throughput for well-behaved sites
    - polite: Minimal load on target servers
    - memory_safe: Reduced memory usage for large crawls
    
    Usage in spider:
        custom_settings = get_performance_settings('aggressive')
    """
    
    base = {
        # Concurrency
        'CONCURRENT_REQUESTS': 16,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 8,
        'CONCURRENT_ITEMS': 100,
        
        # Timeouts
        'DOWNLOAD_TIMEOUT': 30,
        'DNS_TIMEOUT': 10,
        
        # Memory
        'MEMUSAGE_ENABLED': True,
        'MEMUSAGE_LIMIT_MB': 512,
        'MEMUSAGE_WARNING_MB': 400,
        
        # Autothrottle
        'AUTOTHROTTLE_ENABLED': True,
        'AUTOTHROTTLE_START_DELAY': 1,
        'AUTOTHROTTLE_MAX_DELAY': 10,
        'AUTOTHROTTLE_TARGET_CONCURRENCY': 8.0,
        
        # Retry
        'RETRY_ENABLED': True,
        'RETRY_TIMES': 3,
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
        
        # Cache (for development)
        'HTTPCACHE_ENABLED': False,
        
        # Depth
        'DEPTH_LIMIT': 10,
        'DEPTH_PRIORITY': 1,
        
        # Queue (batch settings)
        'REDIS_BATCH_SIZE': 50,
    }
    
    profiles = {
        'default': base,
        
        'aggressive': {
            **base,
            'CONCURRENT_REQUESTS': 32,
            'CONCURRENT_REQUESTS_PER_DOMAIN': 16,
            'DOWNLOAD_DELAY': 0.1,
            'AUTOTHROTTLE_TARGET_CONCURRENCY': 16.0,
            'REDIS_BATCH_SIZE': 100,
        },
        
        'polite': {
            **base,
            'CONCURRENT_REQUESTS': 4,
            'CONCURRENT_REQUESTS_PER_DOMAIN': 2,
            'DOWNLOAD_DELAY': 2,
            'AUTOTHROTTLE_TARGET_CONCURRENCY': 2.0,
            'AUTOTHROTTLE_START_DELAY': 3,
            'REDIS_BATCH_SIZE': 25,
        },
        
        'memory_safe': {
            **base,
            'CONCURRENT_REQUESTS': 8,
            'CONCURRENT_ITEMS': 50,
            'MEMUSAGE_LIMIT_MB': 256,
            'MEMUSAGE_WARNING_MB': 200,
            'CLOSESPIDER_PAGECOUNT': 1000,
            'REDIS_BATCH_SIZE': 25,
        },
        
        'playwright': {
            **base,
            'CONCURRENT_REQUESTS': 4,  # Lower for browser overhead
            'DOWNLOAD_DELAY': 1.5,
            'DOWNLOAD_TIMEOUT': 60,  # Browsers need more time
            'AUTOTHROTTLE_TARGET_CONCURRENCY': 4.0,
            'PLAYWRIGHT_BROWSER_TYPE': 'chromium',
            'PLAYWRIGHT_LAUNCH_OPTIONS': {
                'headless': True,
                'args': ['--no-sandbox', '--disable-dev-shm-usage'],
            },
        },
    }
    
    return profiles.get(profile, base)


# Priority adjustment for different request types
REQUEST_PRIORITIES = {
    'pagination': 0,      # Normal priority
    'listing': 1,         # Slightly higher - list pages
    'detail': 2,          # Higher - detail pages (more valuable)
    'application': 3,     # Highest - application pages
}


def get_request_priority(request_type: str) -> int:
    """Get priority adjustment for request type."""
    return REQUEST_PRIORITIES.get(request_type, 0)


class MemoryManager:
    """
    Utility for managing memory in long-running crawls.
    """
    
    @staticmethod
    def optimize_item(item: dict) -> dict:
        """
        Reduce memory footprint of item before queuing.
        Truncates large text fields.
        """
        optimized = dict(item)
        
        # Truncate large text fields
        text_limits = {
            'description_full': 10000,
            'description_short': 500,
            'raw_data': 5000,
        }
        
        for field, limit in text_limits.items():
            if field in optimized and isinstance(optimized[field], str):
                if len(optimized[field]) > limit:
                    optimized[field] = optimized[field][:limit] + '...'
        
        # Remove None values
        optimized = {k: v for k, v in optimized.items() if v is not None}
        
        return optimized
    
    @staticmethod
    def get_stats() -> dict:
        """Get current memory usage stats."""
        import resource
        usage = resource.getrusage(resource.RUSAGE_SELF)
        return {
            'max_rss_mb': usage.ru_maxrss / 1024,  # Convert to MB
            'user_time': usage.ru_utime,
            'system_time': usage.ru_stime,
        }
