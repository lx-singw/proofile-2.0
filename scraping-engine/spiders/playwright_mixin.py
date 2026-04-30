"""
Playwright Spider Mixin
=======================
Phase 2 Scale: Provides Playwright-based JavaScript rendering for spiders.
Implements hybrid approach: static HTML first, Playwright fallback.
"""
import logging
from typing import Optional, Generator, Any
from scrapy import Request
from scrapy.http import Response

logger = logging.getLogger(__name__)

# Import PageMethod for proper Playwright integration
try:
    from scrapy_playwright.page import PageMethod
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    PageMethod = None


class PlaywrightSpiderMixin:
    """
    Mixin that adds Playwright support to any spider.
    
    Usage:
        class MySpider(PlaywrightSpiderMixin, scrapy.Spider):
            name = 'myspider'
            use_playwright = True  # Enable by default
            
    The mixin provides:
    - Automatic Playwright request creation
    - JavaScript detection
    - Hybrid rendering (static first, Playwright fallback)
    - Page interaction helpers
    """
    
    # Override in spider to enable/disable Playwright
    use_playwright: bool = False
    
    # Playwright launch options
    playwright_headless: bool = True
    playwright_timeout: int = 30000  # 30 seconds
    
    # Selectors that indicate JavaScript-required content
    JS_DETECTION_SELECTORS = [
        '[data-app]',           # Vue/React apps
        '#__next',              # Next.js
        '#root:empty',          # React root without content
        '[ng-app]',            # Angular
        '.loading-spinner',     # Loading indicators
        'noscript',            # NoScript fallback content
    ]
    
    # Selectors that indicate content loaded successfully
    CONTENT_LOADED_SELECTORS = [
        '.job-card',
        '.job-listing',
        '.vacancy',
        '[class*="job"]',
        '[class*="listing"]',
    ]
    
    def make_playwright_request(
        self,
        url: str,
        callback,
        meta: Optional[dict] = None,
        wait_for_selector: Optional[str] = None,
        wait_time: int = 2000,
        **kwargs
    ) -> Request:
        """
        Create a Scrapy request with Playwright rendering.
        
        Args:
            url: Target URL
            callback: Response callback
            meta: Additional meta data
            wait_for_selector: CSS selector to wait for
            wait_time: Time to wait after page load (ms)
            **kwargs: Additional Request arguments
            
        Returns:
            Scrapy Request with Playwright configuration
        """
        page_methods = []
        
        # Add wait for selector if specified and PageMethod is available
        if PLAYWRIGHT_AVAILABLE and PageMethod:
            if wait_for_selector:
                page_methods.append(
                    PageMethod('wait_for_selector', wait_for_selector, timeout=self.playwright_timeout)
                )
            
            # Add timeout wait
            if wait_time > 0:
                page_methods.append(
                    PageMethod('wait_for_timeout', wait_time)
                )
        
        playwright_meta = {
            'playwright': True,
            'playwright_include_page': False,
            'playwright_page_methods': page_methods,
        }
        
        # Merge with provided meta
        if meta:
            playwright_meta.update(meta)
        
        return Request(
            url=url,
            callback=callback,
            meta=playwright_meta,
            **kwargs
        )
    
    def make_hybrid_request(
        self,
        url: str,
        callback,
        meta: Optional[dict] = None,
        **kwargs
    ) -> Request:
        """
        Create a request that will try static HTML first.
        If content detection fails, will retry with Playwright.
        
        Args:
            url: Target URL
            callback: Response callback
            meta: Additional meta data
            **kwargs: Additional Request arguments
            
        Returns:
            Scrapy Request
        """
        request_meta = meta or {}
        request_meta['_hybrid_request'] = True
        request_meta['_original_callback'] = callback.__name__
        
        if self.use_playwright:
            # Start with Playwright for known JS-heavy sites
            return self.make_playwright_request(
                url=url,
                callback=callback,
                meta=request_meta,
                **kwargs
            )
        else:
            # Try static first
            return Request(
                url=url,
                callback=callback,
                meta=request_meta,
                **kwargs
            )
    
    def needs_javascript(self, response: Response) -> bool:
        """
        Detect if the response needs JavaScript rendering.
        
        Checks for common patterns that indicate JS-only content.
        
        Args:
            response: Scrapy Response object
            
        Returns:
            True if JavaScript rendering is needed
        """
        # Check for empty content containers
        for selector in self.JS_DETECTION_SELECTORS:
            if response.css(selector):
                logger.debug(f"JS indicator found: {selector}")
                return True
        
        # Check if expected content is missing
        content_found = False
        for selector in self.CONTENT_LOADED_SELECTORS:
            if response.css(selector):
                content_found = True
                break
        
        if not content_found:
            # Check if page has minimal content (likely needs JS)
            body_text = response.css('body ::text').getall()
            text_content = ' '.join(body_text).strip()
            if len(text_content) < 500:
                logger.debug("Minimal content detected, likely needs JavaScript")
                return True
        
        return False
    
    def get_playwright_settings(self) -> dict:
        """
        Get Playwright-specific settings for custom_settings.
        """
        return {
            'DOWNLOAD_HANDLERS': {
                'http': 'scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler',
                'https': 'scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler',
            },
            'TWISTED_REACTOR': 'twisted.internet.asyncioreactor.AsyncioSelectorReactor',
            'PLAYWRIGHT_LAUNCH_OPTIONS': {
                'headless': self.playwright_headless if hasattr(self, 'playwright_headless') else True,
                'args': [
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                ],
                'ignore_default_args': ['--enable-automation'],
            },
            'PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT': 30000,
        }


# Playwright-enabled custom settings template
PLAYWRIGHT_SETTINGS = {
    'DOWNLOAD_HANDLERS': {
        'http': 'scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler',
        'https': 'scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler',
    },
    'TWISTED_REACTOR': 'twisted.internet.asyncioreactor.AsyncioSelectorReactor',
    'PLAYWRIGHT_LAUNCH_OPTIONS': {
        'headless': True,
        'args': [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
        ],
        'ignore_default_args': ['--enable-automation'],
    },
    'PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT': 30000,
}
