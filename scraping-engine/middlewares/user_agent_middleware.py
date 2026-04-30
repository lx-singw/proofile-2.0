"""
Enhanced User Agent Middleware with Fallback Pool

Quick Win Day 1: Robust user-agent rotation with fallback
"""
import random
import logging

logger = logging.getLogger(__name__)

# Comprehensive fallback user agents in case fake_useragent fails
FALLBACK_USER_AGENTS = [
    # Chrome (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    # Chrome (Mac)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    # Chrome (Linux)
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    # Firefox (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    
    # Firefox (Mac)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:121.0) Gecko/20100101 Firefox/121.0',
    
    # Firefox (Linux)
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    
    # Safari (Mac)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    
    # Edge (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    
    # Mobile User Agents (occasional use for diversity)
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]


class RandomUserAgentMiddleware:
    """
    Assigns a random user agent to each request.
    
    Uses fake_useragent library with fallback to a comprehensive
    hardcoded list for reliability.
    """
    
    def __init__(self):
        self.use_fake_ua = True
        try:
            from fake_useragent import UserAgent
            self.ua = UserAgent(fallback=FALLBACK_USER_AGENTS[0])
            logger.info("Initialized fake_useragent for user-agent rotation")
        except Exception as e:
            logger.warning(f"fake_useragent initialization failed: {e}. Using fallback list.")
            self.use_fake_ua = False
            self.ua = None
    
    def get_random_user_agent(self) -> str:
        """Get a random user agent with fallback."""
        if self.use_fake_ua and self.ua:
            try:
                return self.ua.random
            except Exception:
                # Fallback if fake_useragent fails
                pass
        
        return random.choice(FALLBACK_USER_AGENTS)

    def process_request(self, request, spider):
        """Assign random user agent to request."""
        user_agent = self.get_random_user_agent()
        request.headers['User-Agent'] = user_agent
        
        # Log periodically for debugging (1 in 100 requests)
        if random.random() < 0.01:
            logger.debug(f"Using User-Agent: {user_agent[:50]}...")
