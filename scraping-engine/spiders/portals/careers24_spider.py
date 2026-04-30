"""
Careers24 Spider - Updated for current site structure (Dec 2025)
Scrapes job listings from careers24.com
"""
import scrapy
import json
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link

class Careers24Spider(scrapy.Spider):
    name = 'careers24'
    allowed_domains = ['careers24.com']
    
    # Multi-category start URLs for comprehensive coverage
    start_urls = [
        'https://www.careers24.com/jobs/lc-south-africa/',
        'https://www.careers24.com/jobs/lc-south-africa/kw-graduate/',
        'https://www.careers24.com/jobs/lc-south-africa/kw-internship/',
        'https://www.careers24.com/jobs/lc-south-africa/kw-learnership/',
        'https://www.careers24.com/jobs/lc-south-africa/kw-developer/',
        'https://www.careers24.com/jobs/lc-south-africa/kw-engineer/',
    ]

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 2,
    }

    def parse(self, response):
        """
        Parse the main job listing page.
        CSS selectors updated for current Careers24 structure.
        """
        self.logger.info(f"Parsing {response.url}")
        
        # Job listings are in article or div containers
        # Try multiple selector patterns for resilience
        job_cards = (
            response.css('article.job-card') or 
            response.css('div.job-card') or
            response.css('a[href*="/jobs/adverts/"]')
        )
        
        self.logger.info(f"Found {len(job_cards)} job cards")
        
        for card in job_cards:
            # Extract job URL - the most reliable identifier
            job_url = card.css('a::attr(href)').get()
            if not job_url:
                job_url = card.attrib.get('href')
            
            if job_url and '/jobs/adverts/' in job_url:
                # Make absolute URL
                if not job_url.startswith('http'):
                    job_url = response.urljoin(job_url)
                
                # Create item with basic info
                item = OpportunityItem()
                item['original_url'] = job_url
                item['source_platform'] = 'careers24'
                item['type'] = self._detect_type(job_url)
                
                # Try to get title from card
                title = (
                    card.css('h2::text').get() or 
                    card.css('h3::text').get() or
                    card.css('.job-title::text').get() or
                    card.css('a::text').get()
                )
                if title:
                    item['title'] = title.strip()
                
                # Try to get location from card
                location = card.css('.location::text').get() or card.css('span::text').get()
                if location:
                    item['location'] = location.strip()
                
                # Follow to detail page for complete info
                yield scrapy.Request(
                    job_url,
                    callback=self.parse_details,
                    meta={'item': item},
                    dont_filter=True
                )

        # Pagination - look for next page link
        next_page = (
            response.css('a.next-page::attr(href)').get() or
            response.css('a[rel="next"]::attr(href)').get() or
            response.css('li.next a::attr(href)').get() or
            response.css('a:contains("Next")::attr(href)').get()
        )
        
        if next_page:
            self.logger.info(f"Following pagination: {next_page}")
            yield response.follow(next_page, self.parse)

    def parse_details(self, response):
        """
        Parse the job detail page for full information.
        """
        item = response.meta.get('item', OpportunityItem())
        
        # Title - try multiple selectors
        if not item.get('title'):
            item['title'] = (
                response.css('h1.job-title::text').get() or
                response.css('h1::text').get() or
                response.css('.job-header h1::text').get() or
                response.css('title::text').get()
            )
            if item.get('title'):
                item['title'] = item['title'].strip().split(' - ')[0]  # Clean up title
        
        # Company name
        item['company'] = (
            response.css('.company-name::text').get() or
            response.css('[data-company]::text').get() or
            response.css('a[href*="/company/"]::text').get() or
            'Unknown'
        )
        if item.get('company'):
            item['company'] = item['company'].strip()
        
        # Location
        if not item.get('location'):
            item['location'] = (
                response.css('.location::text').get() or
                response.css('[data-location]::text').get() or
                response.css('.job-location::text').get() or
                'South Africa'
            )
            if item.get('location'):
                item['location'] = item['location'].strip()
        
        # Salary
        item['salary'] = (
            response.css('.salary::text').get() or
            response.css('[data-salary]::text').get() or
            response.css('.job-salary::text').get()
        )
        if item.get('salary'):
            item['salary'] = item['salary'].strip()
        
        # Full description
        description_parts = response.css(
            '.job-description ::text, '
            '.job-details-content ::text, '
            '.description ::text, '
            'article ::text'
        ).getall()
        
        if description_parts:
            item['description_full'] = ' '.join([
                p.strip() for p in description_parts if p.strip()
            ])[:5000]  # Limit description size
        
        # Short description (first 300 chars)
        if item.get('description_full'):
            item['description_short'] = item['description_full'][:300]
        
        # ENHANCED: Extract canonical application link from description
        external_url, link_quality = extract_best_link(response, {})
        is_company_link = is_canonical_link(external_url)
        
        if is_company_link:
            item['canonical_link'] = external_url
            item['original_url'] = external_url
        else:
            item['canonical_link'] = response.url  # Fallback to Careers24 URL
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

    def _detect_type(self, url_or_title):
        """Detect opportunity type from URL or title"""
        text = url_or_title.lower()
        if 'intern' in text:
            return 'internship'
        elif 'learner' in text:
            return 'learnership'
        elif 'bursary' in text or 'bursaries' in text:
            return 'bursary'
        elif 'graduate' in text:
            return 'graduate_program'
        elif 'apprentice' in text:
            return 'apprenticeship'
        else:
            return 'job'
