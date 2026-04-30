"""
Async Link Validator
====================
Phase 1 Foundation: Validates URLs with async HEAD requests.
Checks if links are reachable, follows redirects, validates HTTPS.
"""
import asyncio
import aiohttp
import logging
from typing import Dict, Optional, List, Tuple
from urllib.parse import urlparse
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class LinkValidationResult:
    """Result of validating a single link."""
    url: str
    valid: bool
    status_code: Optional[int] = None
    final_url: Optional[str] = None
    is_https: bool = False
    redirect_count: int = 0
    response_time_ms: float = 0
    error: Optional[str] = None
    validated_at: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            'url': self.url,
            'valid': self.valid,
            'status_code': self.status_code,
            'final_url': self.final_url,
            'is_https': self.is_https,
            'redirect_count': self.redirect_count,
            'response_time_ms': self.response_time_ms,
            'error': self.error,
            'validated_at': self.validated_at,
        }


# Default timeout for validation requests
DEFAULT_TIMEOUT = 10
MAX_REDIRECTS = 5

# Headers to mimic a real browser
VALIDATION_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}


async def validate_link(
    url: str,
    timeout: int = DEFAULT_TIMEOUT,
    follow_redirects: bool = True
) -> LinkValidationResult:
    """
    Validate a single URL using an async HEAD request.
    
    Args:
        url: The URL to validate
        timeout: Request timeout in seconds
        follow_redirects: Whether to follow redirects
        
    Returns:
        LinkValidationResult with validation details
    """
    if not url or not url.startswith(('http://', 'https://')):
        return LinkValidationResult(
            url=url or '',
            valid=False,
            error='Invalid URL format'
        )
    
    start_time = datetime.now()
    
    try:
        timeout_config = aiohttp.ClientTimeout(total=timeout)
        
        async with aiohttp.ClientSession(
            timeout=timeout_config,
            headers=VALIDATION_HEADERS,
            connector=aiohttp.TCPConnector(ssl=False)  # Skip SSL verification for speed
        ) as session:
            async with session.head(
                url,
                allow_redirects=follow_redirects,
                max_redirects=MAX_REDIRECTS
            ) as response:
                elapsed = (datetime.now() - start_time).total_seconds() * 1000
                
                # Get redirect info
                redirect_count = len(response.history)
                final_url = str(response.url)
                
                # Check if valid (2xx status)
                is_valid = 200 <= response.status < 400
                
                return LinkValidationResult(
                    url=url,
                    valid=is_valid,
                    status_code=response.status,
                    final_url=final_url,
                    is_https=final_url.startswith('https://'),
                    redirect_count=redirect_count,
                    response_time_ms=round(elapsed, 2),
                    validated_at=datetime.utcnow().isoformat()
                )
                
    except aiohttp.ClientError as e:
        elapsed = (datetime.now() - start_time).total_seconds() * 1000
        error_type = type(e).__name__
        return LinkValidationResult(
            url=url,
            valid=False,
            error=f"{error_type}: {str(e)[:100]}",
            response_time_ms=round(elapsed, 2),
            validated_at=datetime.utcnow().isoformat()
        )
    except asyncio.TimeoutError:
        return LinkValidationResult(
            url=url,
            valid=False,
            error=f"Timeout after {timeout}s",
            validated_at=datetime.utcnow().isoformat()
        )
    except Exception as e:
        return LinkValidationResult(
            url=url,
            valid=False,
            error=f"Unexpected error: {str(e)[:100]}",
            validated_at=datetime.utcnow().isoformat()
        )


async def validate_links_batch(
    urls: List[str],
    concurrency: int = 10,
    timeout: int = DEFAULT_TIMEOUT
) -> List[LinkValidationResult]:
    """
    Validate multiple URLs concurrently.
    
    Args:
        urls: List of URLs to validate
        concurrency: Max concurrent requests
        timeout: Timeout per request
        
    Returns:
        List of LinkValidationResult objects
    """
    semaphore = asyncio.Semaphore(concurrency)
    
    async def validate_with_semaphore(url: str) -> LinkValidationResult:
        async with semaphore:
            return await validate_link(url, timeout)
    
    tasks = [validate_with_semaphore(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle any exceptions
    processed_results = []
    for url, result in zip(urls, results):
        if isinstance(result, Exception):
            processed_results.append(LinkValidationResult(
                url=url,
                valid=False,
                error=str(result)
            ))
        else:
            processed_results.append(result)
    
    return processed_results


def validate_link_sync(url: str, timeout: int = DEFAULT_TIMEOUT) -> LinkValidationResult:
    """
    Synchronous wrapper for validate_link.
    Use in non-async contexts like Scrapy pipelines.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(validate_link(url, timeout))


def calculate_link_health_score(result: LinkValidationResult) -> int:
    """
    Calculate a health score (0-100) based on validation result.
    
    Scoring:
    - Valid response: +50 points
    - HTTPS: +20 points
    - Fast response (<500ms): +15 points
    - No redirects: +10 points
    - Otherwise +5 for 1-2 redirects
    """
    if not result.valid:
        return 0
    
    score = 50  # Base score for valid link
    
    # HTTPS bonus
    if result.is_https:
        score += 20
    
    # Speed bonus
    if result.response_time_ms < 500:
        score += 15
    elif result.response_time_ms < 1000:
        score += 10
    elif result.response_time_ms < 2000:
        score += 5
    
    # Redirect penalty/bonus
    if result.redirect_count == 0:
        score += 10
    elif result.redirect_count <= 2:
        score += 5
    # More than 2 redirects: no bonus
    
    return min(score, 100)


# Metrics for monitoring (Phase 1)
class LinkValidationMetrics:
    """Track link validation metrics for monitoring."""
    
    def __init__(self):
        self.total_validated = 0
        self.valid_count = 0
        self.invalid_count = 0
        self.https_count = 0
        self.timeout_count = 0
        self.redirect_total = 0
        self.response_time_sum = 0
    
    def record(self, result: LinkValidationResult):
        """Record a validation result."""
        self.total_validated += 1
        
        if result.valid:
            self.valid_count += 1
        else:
            self.invalid_count += 1
            if result.error and 'Timeout' in result.error:
                self.timeout_count += 1
        
        if result.is_https:
            self.https_count += 1
        
        self.redirect_total += result.redirect_count
        self.response_time_sum += result.response_time_ms
    
    def get_summary(self) -> dict:
        """Get metrics summary."""
        return {
            'total_validated': self.total_validated,
            'valid_count': self.valid_count,
            'invalid_count': self.invalid_count,
            'valid_percentage': round(
                (self.valid_count / self.total_validated * 100) 
                if self.total_validated > 0 else 0, 2
            ),
            'https_percentage': round(
                (self.https_count / self.total_validated * 100)
                if self.total_validated > 0 else 0, 2
            ),
            'timeout_count': self.timeout_count,
            'avg_redirects': round(
                self.redirect_total / self.total_validated
                if self.total_validated > 0 else 0, 2
            ),
            'avg_response_time_ms': round(
                self.response_time_sum / self.total_validated
                if self.total_validated > 0 else 0, 2
            ),
        }


# Global metrics instance
validation_metrics = LinkValidationMetrics()
