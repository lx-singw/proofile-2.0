"""
Indeed South Africa Spider - Enhanced with Playwright support
Scrapes job listings from za.indeed.com
Note: Uses Playwright for JavaScript-rendered apply buttons
"""
import scrapy
import json
import re
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link


from ..playwright_mixin import PlaywrightSpiderMixin

class IndeedSpider(PlaywrightSpiderMixin, scrapy.Spider):
    name = 'indeed'
    allowed_domains = ['indeed.com', 'za.indeed.com']
    
    # Indeed South Africa job search URLs
    start_urls = [
        'https://za.indeed.com/jobs?l=South+Africa&sort=date',
        'https://za.indeed.com/jobs?q=graduate&l=South+Africa&sort=date',
        'https://za.indeed.com/jobs?q=internship&l=South+Africa&sort=date',
        'https://za.indeed.com/jobs?q=learnership&l=South+Africa&sort=date',
        'https://za.indeed.com/jobs?q=developer&l=South+Africa&sort=date',
        'https://za.indeed.com/jobs?q=bursary&l=South+Africa&sort=date',
    ]

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 5,  # Increased for Playwright safety
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'COOKIES_ENABLED': True,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        },
        # Mixin will handle Playwright handlers
    }

    def start_requests(self):
        for url in self.start_urls:
            yield self.make_playwright_request(
                url, 
                callback=self.parse,
                wait_for_selector='.job_seen_beacon, .jobsearch-ResultsList, #mosaic-provider-jobcards'
            )

    def parse(self, response):
        """
        Parse the Indeed job search results page.
        """
        self.logger.info(f"Parsing {response.url} - Status: {response.status}")
        
        # Indeed uses various container elements
        job_cards = (
            response.css('div.job_seen_beacon') or
            response.css('.jobsearch-ResultsList > li') or
            response.css('[data-jk]') or
            response.css('.result')
        )
        
        self.logger.info(f"Found {len(job_cards)} job cards")
        
        for card in job_cards:
            item = OpportunityItem()
            item['source_platform'] = 'indeed'
            
            # Job ID and URL
            job_id = card.attrib.get('data-jk') or card.css('[data-jk]::attr(data-jk)').get()
            if job_id:
                item['original_url'] = f'https://za.indeed.com/viewjob?jk={job_id}'
            else:
                job_link = card.css('a[href*="/viewjob"]::attr(href)').get()
                if job_link:
                    item['original_url'] = response.urljoin(job_link)
            
            if not item.get('original_url'):
                continue
            
            # Title
            title = (
                card.css('h2.jobTitle a span::text').get() or
                card.css('h2.jobTitle span::text').get() or
                card.css('.jobTitle::text').get() or
                card.css('a[data-jk]::text').get()
            )
            if title:
                item['title'] = self._clean_text(title)
            
            # Company
            company = (
                card.css('[data-testid="company-name"]::text').get() or
                card.css('.companyName::text').get() or
                card.css('.company::text').get()
            )
            if company:
                item['company'] = self._clean_text(company)
            
            # Location
            location = (
                card.css('[data-testid="text-location"]::text').get() or
                card.css('.companyLocation::text').get() or
                card.css('.location::text').get()
            )
            if location:
                item['location'] = self._clean_text(location)
            
            # Salary (if displayed)
            salary = (
                card.css('.salary-snippet::text').get() or
                card.css('[data-testid="salary-snippet"]::text').get() or
                card.css('.estimated-salary::text').get()
            )
            if salary:
                item['salary'] = self._clean_text(salary)
            
            # Short description
            desc = (
                card.css('.job-snippet::text').get() or
                card.css('.summary::text').get()
            )
            if desc:
                item['description_short'] = self._clean_text(desc)[:300]
            
            # Determine type
            item['type'] = self._detect_type(item.get('title', ''))
            
            # Follow to detail page
            yield scrapy.Request(
                item['original_url'],
                callback=self.parse_detail,
                meta={'item': item},
                dont_filter=True
            )

        # Pagination
        next_page = response.css('a[aria-label="Next Page"]::attr(href)').get()
        if next_page:
            self.logger.info(f"Following pagination")
            yield response.follow(next_page, self.parse)

    def parse_detail(self, response):
        """
        Parse the job detail page.
        """
        item = response.meta.get('item', OpportunityItem())
        
        # Update with detail page info
        if not item.get('title'):
            item['title'] = self._clean_text(
                response.css('h1.jobsearch-JobInfoHeader-title::text').get() or
                response.css('.jobsearch-JobInfoHeader-title ::text').get() or
                ''
            )
        
        if not item.get('company'):
            item['company'] = self._clean_text(
                response.css('[data-company-name="true"]::text').get() or
                response.css('.jobsearch-InlineCompanyRating-companyHeader::text').get() or
                'Unknown'
            )
        
        # Full description
        description_parts = response.css('#jobDescriptionText ::text').getall()
        if description_parts:
            item['description_full'] = ' '.join([
                self._clean_text(p) for p in description_parts if p.strip()
            ])[:5000]
        
        # ENHANCED: Try to extract canonical application link
        # Strategy 1: Use link_validator on description
        external_url, link_quality = extract_best_link(response, {})
        is_company_link = is_canonical_link(external_url)
        
        # Strategy 2: Look for apply button redirect URL
        if not is_company_link:
            apply_url = self._extract_apply_url(response)
            if apply_url and is_canonical_link(apply_url):
                external_url = apply_url
                is_company_link = True
                link_quality = 'indeed_apply_button'
        
        # Set canonical link
        if is_company_link:
            item['canonical_link'] = external_url
            item['original_url'] = external_url
        else:
            item['canonical_link'] = response.url  # Fallback to Indeed URL
            item['original_url'] = response.url
        
        item['is_direct_company_link'] = is_company_link
        item['link_quality'] = link_quality
        
        # Add raw_data for AI pipeline
        item['raw_data'] = json.dumps({
            'source_url': response.url,
            'application_url': external_url if is_company_link else None,
            'link_quality': link_quality,
        })
        
        yield item
    
    def _extract_apply_url(self, response):
        """
        Try to extract the real apply URL from Indeed's page.
        Indeed uses various patterns for apply buttons.
        """
        # Pattern 1: External apply link in JSON data
        script_data = response.css('script[type="application/ld+json"]::text').getall()
        for script in script_data:
            try:
                data = json.loads(script)
                if isinstance(data, dict):
                    # JobPosting schema often has directApply or url field
                    if data.get('@type') == 'JobPosting':
                        apply_url = data.get('directApply') or data.get('url')
                        if apply_url and 'indeed.com' not in apply_url:
                            return apply_url
            except json.JSONDecodeError:
                pass
        
        # Pattern 2: Apply button with external href
        apply_links = (
            response.css('a[data-tn-element="apply-button"]::attr(href)').getall() +
            response.css('a.ia-IndeedApplyButton::attr(href)').getall() +
            response.css('button[data-tn-element="apply-button"]::attr(data-apply-url)').getall() +
            response.css('[class*="apply"] a[href^="http"]::attr(href)').getall()
        )
        
        for link in apply_links:
            if link and 'indeed.com' not in link.lower():
                return link
        
        # Pattern 3: Look for redirect URLs in inline scripts
        scripts = response.css('script:not([src])::text').getall()
        for script in scripts:
            # Look for company URLs in JavaScript
            urls = re.findall(r'https?://(?:www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}[^"\s]*', script)
            for url in urls:
                if all(x not in url.lower() for x in ['indeed.com', 'google', 'facebook', 'twitter', 'linkedin']):
                    if '/apply' in url or '/careers' in url or '/jobs' in url:
                        return url
        
        return None

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
