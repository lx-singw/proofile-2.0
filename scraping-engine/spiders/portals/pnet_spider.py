"""
Pnet Spider - Enhanced with Playwright support (Phase 2)
Scrapes job listings from pnet.co.za
Uses Playwright for JavaScript-rendered content
"""
import scrapy
import json
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link
from spiders.playwright_mixin import PlaywrightSpiderMixin, PLAYWRIGHT_SETTINGS


class PnetSpider(PlaywrightSpiderMixin, scrapy.Spider):
    name = 'pnet'
    allowed_domains = ['pnet.co.za']
    
    # Enable Playwright for this spider
    use_playwright = True
    
    # Start URLs with various search terms
    start_urls = [
        'https://www.pnet.co.za/jobs',
        'https://www.pnet.co.za/jobs/graduate',
        'https://www.pnet.co.za/jobs/internship',
        'https://www.pnet.co.za/jobs/learnership',
        'https://www.pnet.co.za/jobs/developer',
        'https://www.pnet.co.za/jobs/it',
    ]

    custom_settings = {
        **PLAYWRIGHT_SETTINGS,  # Add Playwright handlers
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 3,  # Increased for Playwright
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'COOKIES_ENABLED': True,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        },
    }
    
    def start_requests(self):
        """Generate Playwright-enabled start requests."""
        for url in self.start_urls:
            yield self.make_playwright_request(
                url=url,
                callback=self.parse,
                wait_for='[class*="job"], [class*="listing"], [data-testid], article',  # Wait for job content
                wait_time=5000,   # Wait 5 seconds for JS hydration
            )

    def parse(self, response):
        """
        Parse the search results page.
        PNet is a React/Vue SPA - uses modern selector patterns.
        """
        self.logger.info(f"Parsing {response.url} - Status: {response.status}")
        
        if response.status != 200:
            self.logger.warning(f"Non-200 response: {response.status}")
            return
        
        # Log page content length to verify JS rendered
        content_length = len(response.text)
        self.logger.info(f"Page content length: {content_length} chars")
        
        # Modern SPA selector patterns - expanded for React/Vue/Next.js
        job_cards = (
            # React/Vue component patterns
            response.css('[class*="JobCard"]') or
            response.css('[class*="job-card"]') or
            response.css('[class*="jobCard"]') or
            response.css('[class*="SearchResult"]') or
            response.css('[class*="search-result"]') or
            response.css('[class*="listing-item"]') or
            response.css('[class*="ListingItem"]') or
            
            # Data attribute patterns
            response.css('[data-testid*="job"]') or
            response.css('[data-cy*="job"]') or
            response.css('[data-job-id]') or
            response.css('[data-id]') or
            
            # Semantic patterns
            response.css('article[class*="job"]') or
            response.css('article.job-item') or
            response.css('div.job-card') or
            response.css('li[class*="job"]') or
            
            # Link-based fallback
            response.css('a[href*="/job/"]') or
            response.css('a[href*="/jobs/"]') or
            
            # Generic container patterns
            response.css('.search-result-item') or
            response.css('.results-list > div') or
            response.css('.job-list > *') or
            response.css('[role="listitem"]')
        )
        
        self.logger.info(f"Found {len(job_cards)} job cards")
        
        # If still no cards, try to find any links to job details
        if not job_cards:
            self.logger.warning("No job cards found with standard selectors, trying link extraction")
            job_links = response.css('a[href*="/job/"]::attr(href)').getall()
            self.logger.info(f"Found {len(job_links)} direct job links")
            
            for link in job_links[:20]:  # Limit to first 20
                full_url = response.urljoin(link) if not link.startswith('http') else link
                yield self.make_playwright_request(
                    url=full_url,
                    callback=self.parse_detail,
                    meta={'item': OpportunityItem(source_platform='pnet', original_url=full_url)},
                    wait_for='body',
                    wait_time=3000,
                )
            return
        
        for card in job_cards:
            item = OpportunityItem()
            item['source_platform'] = 'pnet'
            
            # Extract job URL - expanded patterns
            job_url = (
                card.css('a[href*="/job/"]::attr(href)').get() or
                card.css('a[href*="/jobs/"]::attr(href)').get() or
                card.css('[data-href]::attr(data-href)').get() or
                card.css('a.job-link::attr(href)').get() or
                card.css('a::attr(href)').get() or
                card.attrib.get('href') or
                card.attrib.get('data-href')
            )
            
            if job_url:
                if not job_url.startswith('http'):
                    job_url = response.urljoin(job_url)
                item['original_url'] = job_url
            else:
                continue
            
            # Extract title - expanded for React patterns
            title = (
                card.css('[class*="title"] ::text').get() or
                card.css('[class*="Title"] ::text').get() or
                card.css('h2 ::text').get() or
                card.css('h3 ::text').get() or
                card.css('h4 ::text').get() or
                card.css('.job-title ::text').get() or
                card.css('a ::text').get()
            )
            if title:
                item['title'] = self._clean_text(title)
            
            # Extract company - expanded patterns
            company = (
                card.css('[class*="company"] ::text').get() or
                card.css('[class*="Company"] ::text').get() or
                card.css('[class*="employer"] ::text').get() or
                card.css('.company-name ::text').get() or
                card.css('[data-company]::text').get() or
                card.css('[data-employer]::text').get()
            )
            if company:
                item['company'] = self._clean_text(company)
            
            # Extract location - expanded patterns
            location = (
                card.css('[class*="location"] ::text').get() or
                card.css('[class*="Location"] ::text').get() or
                card.css('.job-location ::text').get() or
                card.css('[data-location]::text').get()
            )
            if location:
                item['location'] = self._clean_text(location)
            
            # Extract salary if visible
            salary = card.css('.salary::text').get()
            if salary:
                item['salary'] = self._clean_text(salary)
            
            # Short description from card
            desc = card.css('.job-description::text').get()
            if desc:
                item['description_short'] = self._clean_text(desc)[:300]
            
            # Determine type
            item['type'] = self._detect_type(item.get('title', '') + ' ' + job_url)
            
            # Follow to detail page for full info
            if job_url:
                yield scrapy.Request(
                    job_url,
                    callback=self.parse_detail,
                    meta={'item': item},
                    dont_filter=True
                )
            else:
                yield item

        # Pagination
        next_page = (
            response.css('a.next::attr(href)').get() or
            response.css('a[rel="next"]::attr(href)').get() or
            response.css('.pagination a.next-page::attr(href)').get()
        )
        
        if next_page:
            self.logger.info(f"Following pagination: {next_page}")
            yield response.follow(next_page, self.parse)

    def parse_detail(self, response):
        """
        Parse the full job detail page.
        """
        item = response.meta.get('item', OpportunityItem())
        
        # Update title if not set
        if not item.get('title'):
            item['title'] = self._clean_text(
                response.css('h1::text').get() or
                response.css('.job-title::text').get() or
                ''
            )
        
        # Update company
        if not item.get('company'):
            item['company'] = self._clean_text(
                response.css('.company-name::text').get() or
                response.css('.employer-name::text').get() or
                'Unknown'
            )
        
        # Update location
        if not item.get('location'):
            item['location'] = self._clean_text(
                response.css('.location::text').get() or
                response.css('.job-location::text').get() or
                'South Africa'
            )
        
        # Full description
        description_parts = response.css(
            '.job-description ::text, '
            '.job-details ::text, '
            '.description ::text'
        ).getall()
        
        if description_parts:
            item['description_full'] = ' '.join([
                self._clean_text(p) for p in description_parts if p.strip()
            ])[:5000]
        
        # ENHANCED: Extract canonical application link from description
        external_url, link_quality = extract_best_link(response, {})
        is_company_link = is_canonical_link(external_url)
        
        if is_company_link:
            item['canonical_link'] = external_url
            item['original_url'] = external_url
        else:
            item['canonical_link'] = response.url  # Fallback to PNet URL
            item['original_url'] = response.url
        
        item['is_direct_company_link'] = is_company_link
        item['link_quality'] = link_quality
        
        # Add raw_data for AI pipeline
        item['raw_data'] = json.dumps({
            'source_url': response.url,
            'application_url': external_url if is_company_link else None,
            'link_quality': link_quality,
            'html_snippet': response.text[:5000],
        })
        
        yield item

    def _clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ""
        return " ".join(text.split()).strip()

    def _detect_type(self, text):
        """Detect opportunity type from text"""
        text = text.lower()
        if 'intern' in text:
            return 'internship'
        elif 'learner' in text:
            return 'learnership'
        elif 'bursary' in text:
            return 'bursary'
        elif 'graduate' in text:
            return 'graduate_program'
        elif 'apprentice' in text:
            return 'apprenticeship'
        else:
            return 'job'
