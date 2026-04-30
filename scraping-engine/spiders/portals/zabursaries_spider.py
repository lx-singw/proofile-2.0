"""
ZA Bursaries Spider - Bursary-Focused Spider (Jan 2026)
Scrapes bursaries from zabursaries.co.za with monthly organization.

Site Structure:
- Monthly pages: /bursaries-closing-in-{month}-{year}/
- Individual bursary detail pages
- Special section for ongoing/no-deadline bursaries
- Dynamically published months as time progresses
"""
import scrapy
import re
import json
import hashlib
from datetime import datetime
from dateutil.relativedelta import relativedelta
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link, process_opportunity_link


class ZABursariesSpider(scrapy.Spider):
    name = 'zabursaries'
    allowed_domains = ['zabursaries.co.za', 'www.zabursaries.co.za']
    
    # Custom settings for zabursaries (handles 406 responses)
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'COOKIES_ENABLED': False,
        'ROBOTSTXT_OBEY': False,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en;q=0.9,en-US;q=0.8,en-GB;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.zabursaries.co.za/',
        },
        'RETRY_TIMES': 3,
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
    }
    
    # Month name mapping
    MONTH_MAP = {
        'january': 1, 'jan': 1,
        'february': 2, 'feb': 2,
        'march': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'may': 5,
        'june': 6, 'jun': 6,
        'july': 7, 'jul': 7,
        'august': 8, 'aug': 8,
        'september': 9, 'sep': 9,
        'october': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'december': 12, 'dec': 12,
    }
    
    # Closing date extraction patterns
    CLOSING_DATE_PATTERNS = [
        r'closing\s*date[:\s]+(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        r'application\s*deadline[:\s]+(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        r'applications?\s*close[ds]?\s*(?:on)?\s*[:\s]*(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        r'deadline[:\s]+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})',
        r'clos(?:e|ing)\s*date[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
        r'\b(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})\b',
        r'\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b',  # YYYY-MM-DD or YYYY/MM/DD
    ]
    
    def __init__(self, months_ahead=12, *args, **kwargs):
        super(ZABursariesSpider, self).__init__(*args, **kwargs)
        self.months_ahead = int(months_ahead)
        self.visited_months = set()
        
    def start_requests(self):
        """Generate start URLs for the next N months"""
        # Homepage for latest/featured
        yield scrapy.Request(
            url='https://www.zabursaries.co.za/',
            callback=self.parse_homepage,
            meta={'source': 'homepage'},
            errback=self.handle_error
        )
        
        # Generate monthly URLs
        current_date = datetime.now()
        for i in range(self.months_ahead):
            target_date = current_date + relativedelta(months=i)
            month_name = target_date.strftime('%B').lower()
            year = target_date.year
            
            month_url = f'https://www.zabursaries.co.za/bursaries-closing-in-{month_name}-{year}/'
            
            yield scrapy.Request(
                url=month_url,
                callback=self.parse_month_page,
                meta={
                    'month': month_name,
                    'year': year,
                    'month_url': month_url
                },
                errback=self.handle_month_error,
                dont_filter=True  # Allow revisiting months
            )
    
    def handle_error(self, failure):
        """Handle general request errors"""
        self.logger.error(f"Request failed: {failure.request.url} - {failure.value}")
    
    def handle_month_error(self, failure):
        """Handle month page errors (might indicate month not published yet)"""
        month = failure.request.meta.get('month', 'unknown')
        year = failure.request.meta.get('year', 'unknown')
        
        if hasattr(failure.value, 'response'):
            status = failure.value.response.status
            if status == 404:
                self.logger.info(f"Month not yet published: {month} {year}")
                return
        
        self.logger.warning(f"Failed to fetch {month} {year}: {failure.value}")
    
    def parse_homepage(self, response):
        """Parse homepage for featured/latest bursaries"""
        self.logger.info(f"Parsing homepage: {response.url}")
        
        # Extract article links from homepage
        article_links = response.css('article a::attr(href), .post a::attr(href), h2 a::attr(href)').getall()
        
        for link in article_links:
            full_url = response.urljoin(link)
            if self._is_bursary_detail_page(full_url):
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_bursary_detail,
                    meta={
                        'source': 'homepage',
                        'list_url': response.url
                    }
                )
    
    def parse_month_page(self, response):
        """Parse monthly bursary listing page"""
        month = response.meta.get('month')
        year = response.meta.get('year')
        month_url = response.meta.get('month_url')
        
        self.logger.info(f"Parsing month page: {month} {year}")
        self.visited_months.add((month, year))
        
        # Extract individual bursary links
        # Try multiple selectors for robustness
        bursary_links = response.css(
            'article h2 a::attr(href), '
            '.entry-title a::attr(href), '
            'h3.entry-title a::attr(href), '
            '.post-title a::attr(href)'
        ).getall()
        
        if not bursary_links:
            # Fallback: any article link
            bursary_links = response.css('article a::attr(href)').getall()
        
        self.logger.info(f"Found {len(bursary_links)} bursary links for {month} {year}")
        
        for link in bursary_links:
            full_url = response.urljoin(link)
            if self._is_bursary_detail_page(full_url):
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_bursary_detail,
                    meta={
                        'source': 'month_page',
                        'month': month,
                        'year': year,
                        'list_url': month_url
                    }
                )
        
        # Handle pagination
        next_page = response.css('.next.page-numbers::attr(href), a.next::attr(href)').get()
        if next_page:
            yield scrapy.Request(
                url=response.urljoin(next_page),
                callback=self.parse_month_page,
                meta=response.meta
            )
    
    def _is_bursary_detail_page(self, url):
        """Check if URL is likely a bursary detail page, not a month listing"""
        # Exclude month listing pages
        if 'bursaries-closing-in-' in url:
            return False
        # Exclude category/tag pages
        if '/category/' in url or '/tag/' in url:
            return False
        # Must be from zabursaries domain
        if 'zabursaries.co.za' not in url:
            return False
        return True
    
    def parse_bursary_detail(self, response):
        """Parse individual bursary detail page"""
        self.logger.info(f"Parsing bursary detail: {response.url}")
        
        # Extract title
        title = self._extract_title(response)
        if not title:
            self.logger.warning(f"No title found for {response.url}")
            return
        
        # Filter out blog posts and non-bursary content
        skip_keywords = [
            'questions and answers', 'faq', 'frequently asked questions',
            'which should you choose', 'bursary tips', 'application tips',
            'motivation letter', 'what expenses does', 'all you need to know',
            'how to apply', 'guide to', 'student loans', 'universities', 'institutions'
        ]
        
        if any(keyword in title.lower() for keyword in skip_keywords):
            self.logger.info(f"Skipping non-bursary page: {title}")
            return
        
        # Extract company/organization
        company = self._extract_company(response, title)
        
        # Extract description and metadata (needed for other extractions)
        description = self._extract_description(response)
        
        # Extract location (province/city)
        location = self._extract_location(response, description) or 'South Africa'
        
        # Extract qualification level
        qualification_level = self._extract_qualification_level(response, title, description)
        
        # Extract closing date
        closing_date = self._extract_closing_date(response)
        
        # Fallback: use month context if available
        if not closing_date:
            month = response.meta.get('month')
            year = response.meta.get('year')
            if month and year:
                # Default to last day of month
                month_num = self.MONTH_MAP.get(month.lower(), None)
                if month_num:
                    import calendar
                    last_day = calendar.monthrange(year, month_num)[1]
                    closing_date = {
                        'raw': f"End of {month.capitalize()} {year}",
                        'parsed': f"{year}-{month_num:02d}-{last_day:02d}",
                        'source': 'month_context'
                    }
        
        # Extract application URL
        application_url = self._extract_application_url(response)
        
        # Extract bursary-specific fields
        funding_coverage = self._extract_funding_coverage(response)
        bursary_value = self._extract_bursary_value(response)
        study_fields = self._extract_study_fields(response)
        requirements = self._extract_requirements(response)
        eligibility = self._extract_eligibility(response)
        
        # Apply link validation (don't pass response - we already extracted the best URL)
        preliminary_item = {
            'url': response.url,
            'canonical_link': application_url if application_url != response.url else None,
            'source_url': response.url,
            'title': title,
            'company': company
        }
        
        # Process link validation - skip response to use our extracted URL
        validated_item = process_opportunity_link(preliminary_item)  # No response = don't re-extract
        canonical_link = validated_item.get('canonical_link') or application_url or response.url
        is_company_link = validated_item.get('is_direct_company_link', False)
        link_quality = validated_item.get('link_quality', 'unknown')
        
        # Generate fingerprint for deduplication
        fingerprint = self._generate_fingerprint(title, company, closing_date)
        
        # Build OpportunityItem
        item = OpportunityItem()
        item['title'] = title
        item['company'] = company
        item['description_short'] = description[:200] if description else ""
        item['description_full'] = description[:5000] if description else ""
        item['canonical_link'] = canonical_link
        item['source_url'] = response.url
        item['is_direct_company_link'] = is_company_link
        item['link_quality'] = link_quality
        item['original_url'] = canonical_link
        item['type'] = 'bursary'
        item['location'] = location
        item['source_platform'] = 'zabursaries'
        item['spider'] = self.name
        
        # Build raw_data for AI pipeline
        raw_data = {
            'zabursaries_url': response.url,
            'application_url': application_url,
            'closing_date_raw': closing_date['raw'] if closing_date else None,
            'closing_date_parsed': closing_date['parsed'] if closing_date else None,
            'closing_date_source': closing_date.get('source', 'extracted') if closing_date else None,
            'funding_coverage': funding_coverage,
            'bursary_value': bursary_value,
            'study_fields': study_fields,
            'requirements': requirements,
            'eligibility': eligibility,
            'qualification_level': qualification_level,
            'scraped_at': datetime.utcnow().isoformat(),
            'dedup_fingerprint': fingerprint,
            'html_snippet': response.text[:5000],
            'source_month': response.meta.get('month'),
            'source_year': response.meta.get('year'),
            'list_page_url': response.meta.get('list_url', ''),
            'is_ongoing': closing_date is None,
            'quality_signals': {
                'has_closing_date': bool(closing_date),
                'has_company': company != 'Unknown',
                'has_application_url': bool(application_url),
                'has_funding_details': bool(funding_coverage or bursary_value),
                'has_requirements': bool(requirements),
                'has_study_fields': bool(study_fields),
                'description_length': len(description) if description else 0,
                'is_ongoing': closing_date is None,
            }
        }
        item['raw_data'] = json.dumps(raw_data)
        
        if self._validate_item(item):
            yield item
        else:
            self.logger.warning(f"Invalid item skipped: {title}")
    
    def _extract_title(self, response):
        """Extract bursary title"""
        selectors = [
            'h1.entry-title',
            'h1.post-title',
            'h1',
            '.entry-title',
            'article h1',
            'title'
        ]
        
        for selector in selectors:
            title = response.css(f'{selector}::text').get()
            if title:
                return title.strip()
        
        return None
    
    def _extract_company(self, response, title):
        """Extract company/organization name with enhanced patterns"""
        # Try meta tags
        company = response.css('meta[property="og:site_name"]::attr(content)').get()
        if company and company.lower() != 'za bursaries':
            return company.strip()
        
        content_text = ' '.join(response.css('.entry-content p::text, article p::text').getall()[:5])
        
        # Pattern 1: Look for "by Company" or "from Company" in content
        by_patterns = [
            r'(?:offered by|sponsored by|provided by|by)\s+([A-Z][A-Za-z0-9\s&.,()]+?)(?:\s+(?:is|are|has|have|offers?|provides?)|[.,]|$)',
            r'(?:from|through)\s+(?:the\s+)?([A-Z][A-Za-z0-9\s&.,()]+?)(?:\s+(?:is|are|has|have)|[.,]|$)',
        ]
        
        for pattern in by_patterns:
            match = re.search(pattern, content_text, re.IGNORECASE)
            if match:
                company_name = match.group(1).strip()
                # Clean up common endings
                company_name = re.sub(r'\s+(is|are|has|have|the)$', '', company_name, flags=re.IGNORECASE)
                if len(company_name) > 3 and len(company_name) < 100:
                    return company_name
        
        # Pattern 2: Extract from title ("Company Name Bursary 2026")
        title_clean = re.sub(r'\b(bursary|scholarship|grant|funding|study grant|award)s?\b', '', title, flags=re.IGNORECASE)
        title_clean = re.sub(r'\b(20\d{2}|south africa)\b', '', title_clean, flags=re.IGNORECASE)
        title_clean = title_clean.strip(' -|:')
        
        if title_clean and len(title_clean) > 3:
            return title_clean
        
        # Pattern 3: Look for email domain
        email_match = re.search(r'@([a-zA-Z0-9-]+)\.(co\.za|org|com)', content_text)
        if email_match:
            domain = email_match.group(1)
            return domain.replace('-', ' ').title()
        
        return 'Unknown'
    
    def _extract_description(self, response):
        """Extract and clean bursary description"""
        # Extract main content
        content_paragraphs = response.css('.entry-content p::text, article p::text, .post-content p::text').getall()
        
        if not content_paragraphs:
            # Fallback to any text
            content_paragraphs = response.css('.entry-content::text, article::text').getall()
        
        description = ' '.join([p.strip() for p in content_paragraphs if p.strip()])
        
        # Clean up common noise
        noise_patterns = [
            r'(?:share this|related posts?|you may also like|advertisement|sponsored|\[ad\]).*',
            r'(?:tags?:|categories?:|filed under:).*',
            r'(?:tweet|pin it|share on facebook).*',
        ]
        
        for pattern in noise_patterns:
            description = re.sub(pattern, '', description, flags=re.IGNORECASE)
        
        # Remove excessive whitespace
        description = re.sub(r'\s+', ' ', description).strip()
        
        return description
    
    def _extract_closing_date(self, response):
        """Extract closing date from content"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall()).lower()
        
        for pattern in self.CLOSING_DATE_PATTERNS:
            match = re.search(pattern, content_text, re.IGNORECASE)
            if match:
                try:
                    groups = match.groups()
                    
                    # Handle different date formats
                    if len(groups) == 3:
                        if groups[0].isdigit() and len(groups[0]) == 4:  # YYYY-MM-DD
                            year, month, day = groups
                            parsed_date = f"{year}-{int(month):02d}-{int(day):02d}"
                        elif groups[1].isdigit():  # DD/MM/YYYY or DD-MM-YYYY
                            day, month, year = groups
                            parsed_date = f"{year}-{int(month):02d}-{int(day):02d}"
                        else:  # DD Month YYYY
                            day, month_name, year = groups
                            month_num = self.MONTH_MAP.get(month_name.lower()[:3], None)
                            if month_num:
                                parsed_date = f"{year}-{month_num:02d}-{int(day):02d}"
                            else:
                                continue
                        
                        return {
                            'raw': match.group(0),
                            'parsed': parsed_date,
                            'source': 'extracted'
                        }
                except Exception as e:
                    self.logger.warning(f"Date parsing error: {e}")
                    continue
        
        return None
    
    def _extract_application_url(self, response):
        """Extract application URL - prioritize direct company links"""
        
        # URLs to avoid (generic aggregator pages)
        BLOCKED_URLS = [
            'apply-for-student-loan',
            'apply-for-bursary',
            'how-to-apply',
            'bursary-application-tips',
            'zabursaries.co.za/category',
            'zabursaries.co.za/tag',
        ]
        
        def is_valid_application_url(url):
            """Check if URL is a valid application link"""
            if not url:
                return False
            url_lower = url.lower()
            # Block internal zabursaries generic pages
            for blocked in BLOCKED_URLS:
                if blocked in url_lower:
                    return False
            return True
        
        def is_external_company_link(url):
            """Check if URL is an external company link"""
            if not url or not url.startswith('http'):
                return False
            return 'zabursaries.co.za' not in url.lower()
        
        # Priority 1: Look for external links in content (best quality)
        external_links = response.css('.entry-content a[href]::attr(href)').getall()
        for link in external_links:
            if is_external_company_link(link) and is_valid_application_url(link):
                return link
        
        # Priority 2: Look for links with "apply" in text pointing externally
        apply_buttons = response.css('a:contains("Apply"), a:contains("apply"), a:contains("APPLY")')
        for btn in apply_buttons:
            href = btn.css('::attr(href)').get()
            if href and is_external_company_link(href) and is_valid_application_url(href):
                return href
        
        # Priority 3: Look for links with application-related keywords in URL
        all_links = response.css('a[href]::attr(href)').getall()
        application_keywords = ['careers', 'jobs', 'vacancies', 'apply', 'application', 'bursary']
        for link in all_links:
            if is_external_company_link(link):
                link_lower = link.lower()
                if any(kw in link_lower for kw in application_keywords):
                    return link
        
        # Priority 4: Any external link (fallback)
        for link in external_links:
            if is_external_company_link(link):
                return link
        
        # Priority 5: Internal zabursaries link if it's a specific bursary page (not generic)
        for link in all_links:
            full_url = response.urljoin(link)
            if 'zabursaries.co.za' in full_url and is_valid_application_url(full_url):
                # Only accept specific bursary detail pages, not generic pages
                if '-bursary' in link or '-scholarship' in link or '-grant' in link:
                    continue  # Skip, this is just another aggregator page
        
        # If nothing found, return the source URL itself
        return response.url
    
    def _extract_funding_coverage(self, response):
        """Extract what the bursary covers"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall())
        
        coverage_keywords = ['covers', 'includes', 'pays for', 'funding includes']
        coverage_items = []
        
        for keyword in coverage_keywords:
            if keyword in content_text.lower():
                # Extract surrounding text
                match = re.search(rf'{keyword}[:\s]*([^.;]+)', content_text, re.IGNORECASE)
                if match:
                    coverage_items.append(match.group(1).strip())
        
        return ', '.join(coverage_items) if coverage_items else None
    
    def _extract_bursary_value(self, response):
        """Extract bursary monetary value"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall())
        
        # Look for currency amounts
        value_patterns = [
            r'R\s*[\d,]+(?:\s*(?:per|a)\s+(?:year|annum|month))?',
            r'[\d,]+\s*(?:rand|ZAR)(?:\s*(?:per|a)\s+(?:year|annum|month))?',
        ]
        
        for pattern in value_patterns:
            match = re.search(pattern, content_text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        
        return None
    
    def _extract_location(self, response, description):
        """Extract location (province or city) from content"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall()).lower()
        
        # SA Provinces
        provinces = [
            'gauteng', 'western cape', 'eastern cape', 'kwazulu-natal', 'kzn',
            'free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape'
        ]
        
        # Major cities
        cities = [
            'johannesburg', 'cape town', 'durban', 'pretoria', 'port elizabeth',
            'bloemfontein', 'east london', 'nelspruit', 'polokwane', 'kimberley',
            'pietermaritzburg', 'rustenburg', 'george'
        ]
        
        # Check provinces first (more general)
        for province in provinces:
            if province in content_text:
                return province.title()
        
        # Then check cities
        for city in cities:
            if city in content_text:
                return city.title()
        
        return None
    
    def _extract_qualification_level(self, response, title, description):
        """Detect qualification level (undergraduate, postgraduate, etc.)"""
        content_text = f"{title} {description}".lower()
        
        # Postgraduate indicators
        postgrad_patterns = [
            r'\bpostgraduate\b', r'\bpost-graduate\b', r'\bpost graduate\b',
            r'\bmasters?\b', r'\bm\.?sc\.?\b', r'\bm\.?com\.?\b', r'\bm\.?a\.?\b',
            r'\bphd\b', r'\bdoctorate\b', r'\bhonours?\b', r'\bhons\.?\b',
            r'\bmbbs\b', r'\bmbbch\b', r'\bllm\b'
        ]
        
        for pattern in postgrad_patterns:
            if re.search(pattern, content_text):
                return 'Postgraduate'
        
        # Diploma indicators
        diploma_patterns = [
            r'\bdiploma\b', r'\bn\.?dipl?\b', r'\bnat\.?\s*dip\.?\b',
            r'\bnational diploma\b', r'\bhigher certificate\b'
        ]
        
        for pattern in diploma_patterns:
            if re.search(pattern, content_text):
                return 'Diploma'
        
        # Undergraduate indicators (default if nothing else found)
        undergrad_patterns = [
            r'\bundergraduate\b', r'\bunder-graduate\b',
            r'\bb\.?sc\.?\b', r'\bb\.?com\.?\b', r'\bb\.?a\.?\b',
            r'\bb\.?tech\.?\b', r'\bllb\b', r'\bbachelor'
        ]
        
        for pattern in undergrad_patterns:
            if re.search(pattern, content_text):
                return 'Undergraduate'
        
        # Default assumption for bursaries
        return 'Undergraduate'
    
    
    def _extract_study_fields(self, response):
        """Extract applicable study fields with enhanced patterns"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall()).lower()
        
        fields = []
        
        # Degree codes (very specific)
        degree_patterns = [
            (r'\bb\.?sc\.?(?:\s+(?:hons?\.?|honours?))?\s+(?:in\s+)?([a-z\s]+?)(?:\s+or|\s+and|[,.]|$)', lambda m: m.group(1).strip()),
            (r'\bb\.?com\.?(?:\s+(?:hons?\.?|honours?))?\s+(?:in\s+)?([a-z\s]+?)(?:\s+or|\s+and|[,.]|$)', lambda m: m.group(1).strip()),
            (r'\bb\.?a\.?(?:\s+(?:hons?\.?|honours?))?\s+(?:in\s+)?([a-z\s]+?)(?:\s+or|\s+and|[,.]|$)', lambda m: m.group(1).strip()),
            (r'\bb\.?tech\.?\s+(?:in\s+)?([a-z\s]+?)(?:\s+or|\s+and|[,.]|$)', lambda m: m.group(1).strip()),
            (r'\bllb\b', lambda m: 'law'),
            (r'\bmbbch\b|\bmb\s*ch\s*b\b', lambda m: 'medicine'),
        ]
        
        for pattern, extractor in degree_patterns:
            for match in re.finditer(pattern, content_text, re.IGNORECASE):
                field = extractor(match)
                if field and len(field) > 2:
                    fields.append(field.title())
        
        # Broad field keywords
        field_keywords = [
            ('engineering', ['mechanical', 'electrical', 'civil', 'chemical', 'industrial']),
            ('computer science', ['it', 'information technology', 'software', 'computer']),
            ('medicine', ['medical', 'health science', 'nursing']),
            ('accounting', ['chartered accountant', 'ca', 'finance', 'auditing']),
            ('law', ['legal studies', 'jurisprudence']),
            ('mathematics', ['statistics', 'actuarial']),
            ('science', ['physics', 'chemistry', 'biology']),
            ('education', ['teaching', 'teacher training']),
            ('agriculture', ['agricultural', 'agri']),
            ('architecture', ['architectural']),
        ]
        
        for main_field, variations in field_keywords:
            # Check main field and variations
            if any(var in content_text for var in [main_field] + variations):
                fields.append(main_field.title())
        
        return list(set(fields)) if fields else None
    
    def _extract_requirements(self, response):
        """Extract requirements"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall())
        
        # Look for requirements section
        req_match = re.search(r'requirements?[:\s]*(.{0,500})', content_text, re.IGNORECASE | re.DOTALL)
        if req_match:
            return req_match.group(1).strip()
        
        return None
    
    def _extract_eligibility(self, response):
        """Extract eligibility criteria"""
        content_text = ' '.join(response.css('.entry-content::text, article::text').getall())
        
        # Look for eligibility section
        elig_match = re.search(r'eligib(?:le|ility)[:\s]*(.{0,500})', content_text, re.IGNORECASE | re.DOTALL)
        if elig_match:
            return elig_match.group(1).strip()
        
        return None
    
    def _generate_fingerprint(self, title, company, closing_date):
        """Generate unique fingerprint for deduplication"""
        # Normalize title
        title_norm = re.sub(r'\s+', ' ', title.lower()).strip()
        company_norm = re.sub(r'\s+', ' ', company.lower()).strip()
        
        # Include closing date or mark as ongoing
        if closing_date:
            date_str = closing_date.get('parsed', '')
        else:
            date_str = 'ongoing'
        
        fingerprint_str = f"{title_norm}|{company_norm}|{date_str}"
        return hashlib.md5(fingerprint_str.encode('utf-8')).hexdigest()
    
    def _validate_item(self, item):
        """Validate item before yielding"""
        if not item.get('title'):
            return False
        if not item.get('description_full'):
            return False
        if not item.get('company'):
            return False
        return True
