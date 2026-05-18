"""
Smart Rate Limiter Middleware
=============================
Implements adaptive rate limiting with:
- Per-domain rate limiting
- Circuit breaker for failing domains
- Adaptive delay based on response times
- Exponential backoff on errors
"""
import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional
from urllib.parse import urlparse

from scrapy import signals
from scrapy.exceptions import IgnoreRequest
from scrapy.http import Request, Response

logger = logging.getLogger(__name__)


class DomainState:
    """Tracks state for a single domain."""
    
    def __init__(self, base_delay: float = 2.0):
        self.base_delay = base_delay
        self.current_delay = base_delay
        self.last_request_time: Optional[float] = None
        self.consecutive_errors = 0
        self.consecutive_successes = 0
        self.is_circuit_open = False
        self.circuit_open_until: Optional[datetime] = None
        self.response_times: list = []
        self.total_requests = 0
        self.total_errors = 0
    
    def record_success(self, response_time: float):
        """Record a successful request."""
        self.consecutive_successes += 1
        self.consecutive_errors = 0
        self.total_requests += 1
        self.response_times.append(response_time)
        
        # Keep only last 10 response times
        if len(self.response_times) > 10:
            self.response_times.pop(0)
        
        # Adaptive delay: decrease if consistently successful
        if self.consecutive_successes >= 5:
            self.current_delay = max(self.base_delay * 0.5, self.current_delay * 0.9)
            self.consecutive_successes = 0
        
        # Close circuit if it was open
        if self.is_circuit_open:
            self.is_circuit_open = False
            self.circuit_open_until = None
            logger.info(f"Circuit closed, resuming normal operation")
    
    def record_error(self, status_code: int = 0):
        """Record a failed request."""
        self.consecutive_errors += 1
        self.consecutive_successes = 0
        self.total_errors += 1
        self.total_requests += 1
        
        # Exponential backoff
        self.current_delay = min(60.0, self.current_delay * 2)
        
        # Open circuit breaker after 5 consecutive errors
        if self.consecutive_errors >= 5:
            self.is_circuit_open = True
            # Exponential circuit open duration: 1min, 2min, 4min, 8min, max 30min
            open_duration = min(30, 2 ** (self.consecutive_errors - 5))
            self.circuit_open_until = datetime.now() + timedelta(minutes=open_duration)
            logger.warning(f"Circuit opened for {open_duration} minutes")
    
    def should_allow_request(self) -> tuple[bool, float]:
        """
        Check if a request should be allowed.
        Returns (allowed, wait_time).
        """
        now = datetime.now()
        
        # Check circuit breaker
        if self.is_circuit_open:
            if self.circuit_open_until and now < self.circuit_open_until:
                wait_seconds = (self.circuit_open_until - now).total_seconds()
                return False, wait_seconds
            # Circuit timeout expired, allow one test request
            self.is_circuit_open = False
        
        # Check rate limit
        if self.last_request_time:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.current_delay:
                return True, self.current_delay - elapsed
        
        return True, 0
    
    def get_avg_response_time(self) -> float:
        """Get average response time."""
        if not self.response_times:
            return 0
        return sum(self.response_times) / len(self.response_times)


class SmartRateLimiterMiddleware:
    """
    Scrapy middleware for smart per-domain rate limiting.
    
    Features:
    - Per-domain rate limiting
    - Circuit breaker for failing domains
    - Adaptive delay based on response times
    - Exponential backoff on errors
    
    Enable in settings.py:
    DOWNLOADER_MIDDLEWARES = {
        'middlewares.rate_limiter.SmartRateLimiterMiddleware': 100,
    }
    
    Configure with:
    RATE_LIMIT_BASE_DELAY = 2.0
    RATE_LIMIT_MAX_DELAY = 60.0
    RATE_LIMIT_CIRCUIT_THRESHOLD = 5
    """
    
    def __init__(self, base_delay: float = 2.0):
        self.base_delay = base_delay
        self.domains: Dict[str, DomainState] = defaultdict(
            lambda: DomainState(base_delay)
        )
    
    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls(
            base_delay=crawler.settings.getfloat('RATE_LIMIT_BASE_DELAY', 2.0),
        )
        crawler.signals.connect(middleware.spider_closed, signal=signals.spider_closed)
        return middleware
    
    def _get_domain(self, url: str) -> str:
        """Extract domain from URL."""
        parsed = urlparse(url)
        return parsed.netloc or parsed.path.split('/')[0]
    
    def process_request(self, request: Request, spider):
        """Process outgoing request - apply rate limiting."""
        domain = self._get_domain(request.url)
        state = self.domains[domain]
        
        allowed, wait_time = state.should_allow_request()
        
        if not allowed:
            logger.warning(f"Circuit open for {domain}, skipping request")
            raise IgnoreRequest(f"Circuit breaker open for {domain}")
        
        if wait_time > 0:
            logger.debug(f"Rate limiting {domain}, waiting {wait_time:.2f}s")
            time.sleep(wait_time)
        
        # Record request time
        state.last_request_time = time.time()
        request.meta['_rate_limit_start'] = time.time()
        
        return None
    
    def process_response(self, request: Request, response: Response, spider):
        """Process response - update rate limit state."""
        domain = self._get_domain(request.url)
        state = self.domains[domain]
        
        # Calculate response time
        start_time = request.meta.get('_rate_limit_start', time.time())
        response_time = time.time() - start_time
        
        if 200 <= response.status < 400:
            state.record_success(response_time)
        elif response.status in [429, 503, 520, 521, 522, 523, 524]:
            # Rate limited or server overload
            state.record_error(response.status)
            logger.warning(f"Rate limit/overload response ({response.status}) from {domain}")
        elif response.status >= 500:
            state.record_error(response.status)
        
        return response
    
    def process_exception(self, request: Request, exception, spider):
        """Process exception - record error."""
        domain = self._get_domain(request.url)
        state = self.domains[domain]
        state.record_error()
        logger.warning(f"Request exception for {domain}: {exception}")
        return None
    
    def spider_closed(self, spider):
        """Log rate limiting stats on spider close."""
        logger.info("=== Rate Limiter Stats ===")
        for domain, state in self.domains.items():
            if state.total_requests > 0:
                error_rate = state.total_errors / state.total_requests * 100
                avg_rt = state.get_avg_response_time()
                logger.info(
                    f"  {domain}: {state.total_requests} requests, "
                    f"{error_rate:.1f}% errors, {avg_rt:.2f}s avg response"
                )
