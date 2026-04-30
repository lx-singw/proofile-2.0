from spiders.base_spider import BaseOpportunitySpider
import scrapy

class FacebookSpider(BaseOpportunitySpider):
    """
    Scraper for Facebook Groups (The Pulse).
    Layer 1: Social Media
    Requires Playwright for dynamic content loading.
    """
    name = "facebook"
    allowed_domains = ["facebook.com"]
    start_urls = ["https://www.facebook.com/groups/jobsearchsa/"] # Example group

    def parse(self, response):
        """
        In MVP, we follow a 'headless first' approach but Facebook usually 
        requires JavaScript rendering (Playwright middleware).
        """
        # Posts are often in div[role="feed"]
        posts = response.css('div[role="article"]')
        
        for post in posts:
            text = " ".join(post.css('div[dir="auto"] ::text').getall())
            if "job" in text.lower() or "vacancy" in text.lower():
                yield {
                    'title': self.clean_text(text[:50]) + "...",
                    'description_full': self.clean_text(text),
                    'source': 'Facebook Groups',
                    'original_url': response.url,
                }
