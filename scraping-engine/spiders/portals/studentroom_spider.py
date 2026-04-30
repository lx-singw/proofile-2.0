"""
StudentRoom Spider - Education Layer Spider (Dec 2025)
Scrapes internships, bursaries, learnerships, and apprenticeships from studentroom.co.za

StudentRoom.co.za is a major aggregator of South African student opportunities including:
- Internships (Yes4Youth, corporate programs)
- Bursaries (SETA, corporate, government)
- Learnerships (SETA-accredited training)
- Apprenticeships (trade skills)
- Training programmes

Site Structure:
- Homepage lists recent opportunities (paginated, 2437+ pages)
- Each article contains detailed opportunity info with closing dates
- External application links to company career portals
"""
import scrapy
import re
import json
import hashlib
from datetime import datetime
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link, process_opportunity_link


class StudentRoomSpider(scrapy.Spider):
    name = 'studentroom'
    allowed_domains = ['studentroom.co.za', 'www.studentroom.co.za']
    
    # Start URLs - homepage and category pages for comprehensive coverage
    start_urls = [
        'https://www.studentroom.co.za/',  # Homepage for latest
        'https://www.studentroom.co.za/category/bursaries/',  # SA Bursaries
        'https://www.studentroom.co.za/category/internships/',  # Internships SA
        'https://www.studentroom.co.za/category/learnership/',  # Learnerships
    ]

    # Custom settings for polite crawling
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,  # 2 seconds between requests - be polite
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,  # Single request at a time
        'COOKIES_ENABLED': False,  # StudentRoom doesn't require cookies
        'ROBOTSTXT_OBEY': False,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en;q=0.9,en-US;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        },
        # Retry logic for transient failures
        'RETRY_TIMES': 3,
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
        # Limit pagination to prevent overloading (configurable via CLI)
        'CLOSESPIDER_PAGECOUNT': 100,  # Default max 100 pages per category
    }

    # Maximum pages to crawl per run (can be overridden via settings)
    max_pages = 50

    # Regex patterns for closing date extraction
    CLOSING_DATE_PATTERNS = [
        # "Closing Date: 31 December 2025"
        r'closing\s*date[:\s]+(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        # "Application Deadline: 02 January 2026"
        r'application\s*deadline[:\s]+(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        # "Applications close on 30 December 2025"
        r'applications?\s*close[ds]?\s*(?:on)?\s*[:\s]*(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        # "Deadline: 31 Jan 2026"
        r'deadline[:\s]+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})',
        # "Close date: 31/12/2025" or "31-12-2025"
        r'clos(?:e|ing)\s*date[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
        # "31 December 2025" (standalone date in context)
        r'\b(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})\b',
    ]

    # Month name to number mapping
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

    # South African provinces for location detection
    SA_PROVINCES = [
        'gauteng', 'western cape', 'kwazulu-natal', 'kwazulu natal', 'kzn',
        'eastern cape', 'free state', 'limpopo', 'mpumalanga', 'north west',
        'northern cape'
    ]

    # Major SA cities for location detection
    SA_CITIES = [
        'johannesburg', 'cape town', 'durban', 'pretoria', 'port elizabeth',
        'bloemfontein', 'east london', 'nelspruit', 'polokwane', 'kimberley',
        'midrand', 'sandton', 'centurion', 'soweto', 'rustenburg', 'pietermaritzburg'
    ]

    def __init__(self, max_pages=None, start_urls=None, *args, **kwargs):
        super(StudentRoomSpider, self).__init__(*args, **kwargs)
        if max_pages:
            self.max_pages = int(max_pages)
        if start_urls:
            # Support comma-separated list or single URL
            if isinstance(start_urls, str):
                self.start_urls = [url.strip() for url in start_urls.split(',')]
            else:
                self.start_urls = start_urls
        self.pages_crawled = 0
    
    def start_requests(self):
        """
        Generate initial requests, intelligently routing to parse or parse_detail
        based on URL type.
        """
        for url in self.start_urls:
            # Detect if URL is a direct detail page vs list page
            # Detail pages have specific patterns like "/capitec-bank-is-hiring-service-consultant-3/"
            # List pages are homepage or category URLs like "/internships/" or "studentroom.co.za"
            
            is_detail_page = any([
                re.search(r'/[a-z0-9-]+-\d+/?$', url),  # Ends with slug-number
                'hiring' in url.lower(),
                'vacancy' in url.lower(),
                re.search(r'/20\d{2}/', url),  # Contains year in path
            ])
            
            if is_detail_page:
                self.logger.info(f"Direct detail URL detected: {url}")
                yield scrapy.Request(url, callback=self.parse_detail)
            else:
                self.logger.info(f"List page URL detected: {url}")
                yield scrapy.Request(url, callback=self.parse)


    def parse(self, response):
        """
        Parse list pages (homepage, category pages, pagination pages).
        Extract opportunity cards and follow to detail pages.
        """
        self.logger.info(f"Parsing list page: {response.url} - Status: {response.status}")
        
        if response.status != 200:
            self.logger.warning(f"Non-200 response: {response.status} for {response.url}")
            return
        
        self.pages_crawled += 1
        
        # StudentRoom uses a WordPress blog structure with article cards
        # Try multiple selectors for resilience
        opportunity_cards = (
            response.css('article.post') or
            response.css('article') or
            response.css('.post') or
            response.css('h2 a[href*="studentroom.co.za"]')
        )
        
        self.logger.info(f"Found {len(opportunity_cards)} opportunity cards on {response.url}")
        
        for card in opportunity_cards:
            # Extract the detail page URL
            detail_url = (
                card.css('h2 a::attr(href)').get() or
                card.css('a.entry-title-link::attr(href)').get() or
                card.css('a[rel="bookmark"]::attr(href)').get() or
                card.css('a::attr(href)').get()
            )
            
            if not detail_url:
                continue
            
            # Ensure absolute URL
            if not detail_url.startswith('http'):
                detail_url = response.urljoin(detail_url)
            
            # Skip non-opportunity URLs (author pages, category pages, etc.)
            if any(skip in detail_url for skip in ['/author/', '/tag/', '/category/', '/page/']):
                continue
            
            # Create initial item with data from card
            item = OpportunityItem()
            item['source_platform'] = 'studentroom'
            
            # Extract title from card
            title = (
                card.css('h2 a::text').get() or
                card.css('h2::text').get() or
                card.css('.entry-title a::text').get() or
                card.css('.entry-title::text').get()
            )
            if title:
                item['title'] = self._clean_text(title)
            
            # Extract excerpt/short description from card
            excerpt = (
                card.css('.entry-content p::text').get() or
                card.css('.entry-summary p::text').get() or
                card.css('.excerpt::text').get() or
                card.css('p::text').get()
            )
            if excerpt:
                item['description_short'] = self._clean_text(excerpt)[:300]
            
            # Detect opportunity type from title and URL
            type_context = f"{item.get('title', '')} {detail_url}"
            item['type'] = self._detect_type(type_context)
            
            # Extract categories/tags from card if available
            categories = card.css('a[rel="category tag"]::text').getall()
            if categories:
                # Store raw categories for AI processing
                item['raw_data'] = json.dumps({
                    'categories': [self._clean_text(c) for c in categories],
                    'studentroom_url': detail_url,
                })
            
            # Follow to detail page for complete information
            yield scrapy.Request(
                detail_url,
                callback=self.parse_detail,
                meta={'item': item, 'studentroom_url': detail_url},
                dont_filter=False,  # Enable filtering to prevent duplicates
                priority=1,  # Higher priority than pagination
            )
        
        # Handle pagination (with max_pages limit)
        if self.pages_crawled < self.max_pages:
            next_page = self._find_next_page(response)
            
            if next_page:
                self.logger.info(f"Following pagination to: {next_page} (page {self.pages_crawled + 1}/{self.max_pages})")
                yield scrapy.Request(
                    next_page,
                    callback=self.parse,
                    priority=0,  # Lower priority than detail pages
                )
        else:
            self.logger.info(f"Reached max pages limit ({self.max_pages}). Stopping pagination.")

    def parse_detail(self, response):
        """
        Parse the full opportunity detail page.
        Extract all available information including closing dates.
        """
        item = response.meta.get('item', OpportunityItem())
        studentroom_url = response.meta.get('studentroom_url', response.url)
        
        self.logger.info(f"Parsing detail page: {response.url}")
        
        if response.status != 200:
            self.logger.warning(f"Non-200 response: {response.status} for {response.url}")
            return
        
        # Update/extract title
        if not item.get('title'):
            title = (
                response.css('h1.entry-title::text').get() or
                response.css('h1::text').get() or
                response.css('.entry-title::text').get() or
                response.css('title::text').get()
            )
            if title:
                item['title'] = self._clean_text(title)
        
        # Extract company name from title or content
        company = self._extract_company(item.get('title', ''), response)
        item['company'] = company if company else 'Unknown'
        
        # Extract location from content
        location = self._extract_location(response)
        item['location'] = location if location else 'South Africa'
        
        # Extract full description
        description_parts = response.css(
            'article .entry-content ::text, '
            '.post-content ::text, '
            '.content ::text, '
            'article p ::text'
        ).getall()
        
        if description_parts:
            full_description = ' '.join([
                self._clean_text(p) for p in description_parts if p.strip()
            ])
            item['description_full'] = full_description[:10000]  # Limit size
            if not item.get('description_short'):
                item['description_short'] = full_description[:300]
        
        # Extract closing date (critical for time-sensitive opportunities)
        closing_date = self._extract_closing_date(response, item.get('description_full', ''))
        
        # Extract external application URL using enhanced link validator
        external_url, link_quality = extract_best_link(response, {})
        
        # Validate that we have a proper company link
        is_company_link = is_canonical_link(external_url)
        
        # Set canonical_link to the best external link (company page)
        # Set source_url to our StudentRoom page (where we found it)
        item['canonical_link'] = external_url if is_company_link else studentroom_url
        item['source_url'] = studentroom_url
        item['is_direct_company_link'] = is_company_link
        item['link_quality'] = link_quality
        
        # For backwards compatibility, also set original_url
        item['original_url'] = item['canonical_link']
        # Extract eligibility criteria
        eligibility = self._extract_eligibility(item.get('description_full', ''))
        
        # Extract required documents
        required_documents = self._extract_required_documents(item.get('description_full', ''))
        
        # Extract salary and contacts
        salary = self._extract_salary(item.get('description_full', ''))
        contacts = self._extract_contacts(item.get('description_full', ''))
        sector = self._detect_sector(item.get('description_full', ''))
        
        fingerprint = self._generate_fingerprint(item.get('title', ''), item.get('company', ''))
        is_pdf = external_url.lower().endswith('.pdf') if external_url else False
        
        # Extract structured requirements (Phase 1 enhancement)
        structured_req = self._extract_structured_requirements(response)
        
        # Prefer application URL from structured extraction (more accurate)
        # Falls back to generic external_url from link_validator
        best_application_url = structured_req.get('application_url') or external_url
        
        # If we found a better URL in structured extraction, update canonical_link
        if structured_req.get('application_url') and structured_req.get('application_url') != external_url:
            item['canonical_link'] = structured_req.get('application_url')
            self.logger.info(f"Using structured requirement application URL: {structured_req.get('application_url')}")
        
        # Build comprehensive raw_data for AI pipeline processing
        raw_data = item.get('raw_data', '{}')
        try:
            raw_data_dict = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        except json.JSONDecodeError:
            raw_data_dict = {}
        
        raw_data_dict.update({
            'studentroom_url': studentroom_url,
            'application_url': best_application_url,  # Use the best URL
            'closing_date_raw': closing_date.get('raw') if closing_date else None,
            'closing_date_parsed': closing_date.get('parsed') if closing_date else None,
            'eligibility': eligibility,
            'required_documents': required_documents,
            'salary': salary,
            'contacts': contacts,
            'sector': sector,
            'dedup_fingerprint': fingerprint,
            'is_pdf_application': is_pdf,
            'scraped_at': datetime.utcnow().isoformat(),
            'html_snippet': response.text[:5000],  # First 5KB for debugging
            # Structured requirements (Phase 1)
            'structured_requirements': structured_req,
        })
        
        item['raw_data'] = json.dumps(raw_data_dict)


        
        # Update type detection with full content
        if item.get('description_full'):
            type_context = f"{item.get('title', '')} {item.get('description_full', '')}"
            item['type'] = self._detect_type(type_context)
        
        # Log extracted data summary
        self.logger.info(
            f"Extracted: {item.get('title', 'Unknown')[:50]}... | "
            f"Company: {item.get('company', 'Unknown')} | "
            f"Type: {item.get('type', 'unknown')} | "
            f"Closing: {closing_date.get('parsed') if closing_date else 'Not found'}"
        )
        
        yield item

    def _find_next_page(self, response):
        """Find the next page URL for pagination."""
        next_page = (
            response.css('a.next::attr(href)').get() or
            response.css('a[rel="next"]::attr(href)').get() or
            response.css('.pagination a.next::attr(href)').get() or
            response.css('a:contains("Next")::attr(href)').get() or
            response.css('a:contains("→")::attr(href)').get() or
            response.css('a:contains("Older posts")::attr(href)').get()
        )
        
        if next_page and not next_page.startswith('http'):
            next_page = response.urljoin(next_page)
        
        return next_page

    def _clean_text(self, text):
        """Clean and normalize text."""
        if not text:
            return ""
        # Remove extra whitespace and normalize
        cleaned = " ".join(text.split()).strip()
        # Remove common unwanted patterns
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned

    def _detect_type(self, text):
        """
        Detect opportunity type from text.
        Order matters - more specific types should be checked first.
        """
        if not text:
            return 'opportunity'
        
        text = text.lower()
        
        # Check in order of specificity
        if 'bursary' in text or 'bursaries' in text:
            return 'bursary'
        elif 'learnership' in text or 'learnerships' in text:
            return 'learnership'
        elif 'apprentice' in text or 'apprenticeship' in text:
            return 'apprenticeship'
        elif 'internship' in text or 'intern ' in text or 'interns ' in text:
            return 'internship'
        elif 'graduate' in text and ('program' in text or 'programme' in text):
            return 'graduate_program'
        elif 'trainee' in text or 'training' in text:
            return 'training_program'
        elif 'yes4youth' in text or 'yes 4 youth' in text or 'y4y' in text:
            return 'internship'  # Yes4Youth is a specific internship program
        elif 'vacancy' in text or 'vacancies' in text or 'job' in text:
            return 'job'
        else:
            return 'opportunity'

    def _extract_company(self, title, response):
        """
        Extract company name from title or content.
        StudentRoom often includes company name in title format: "Company Name Bursaries 2026"
        """
        if not title:
            return None
        
        # Common patterns: "BMW Yes4Youth Internships 2026", "Eskom Bursaries 2026"
        # Extract the first part before opportunity type keywords
        keywords = [
            'bursary', 'bursaries', 'internship', 'internships', 'learnership', 
            'learnerships', 'apprenticeship', 'apprenticeships', 'program', 
            'programme', 'vacancy', 'vacancies', 'job', 'jobs', 'trainee',
            'yes4youth', 'y4y', 'graduate'
        ]
        
        title_lower = title.lower()
        
        for keyword in keywords:
            idx = title_lower.find(keyword)
            if idx > 0:
                company = title[:idx].strip()
                # Clean up common suffixes
                company = re.sub(r'\s+(SA|South Africa|\(Pty\) Ltd|Ltd|Limited|Group)$', '', company, flags=re.IGNORECASE)
                company = company.strip(' -–')
                if len(company) > 2:
                    return company
        
        # Try to find company in meta tags
        og_site_name = response.css('meta[property="og:site_name"]::attr(content)').get()
        if og_site_name and 'studentroom' not in og_site_name.lower():
            return og_site_name
        
        # Look for "by [Company Name]" or "at [Company Name]" patterns in content
        content = response.css('article ::text').getall()
        content_text = ' '.join(content) if content else ''
        
        by_pattern = re.search(r'\b(?:by|at|from)\s+([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Group|SA)?)\b', content_text)
        if by_pattern:
            return by_pattern.group(1).strip()
        
        return None

    def _extract_location(self, response):
        """
        Extract location (province/city) from content.
        """
        content = response.css('article ::text').getall()
        content_text = ' '.join(content).lower() if content else ''
        
        # Check for province mentions
        for province in self.SA_PROVINCES:
            if province in content_text:
                return province.title()
        
        # Check for city mentions
        for city in self.SA_CITIES:
            if city in content_text:
                return city.title()
        
        # Look for "Location:" pattern
        location_pattern = re.search(
            r'location[:\s]+([A-Za-z\s,]+?)(?:\.|$|\n)',
            content_text,
            re.IGNORECASE
        )
        if location_pattern:
            return location_pattern.group(1).strip().title()
        
        return None

    def _extract_closing_date(self, response, description):
        """
        Extract and parse closing date from content.
        Returns dict with 'raw' (original text) and 'parsed' (ISO format) keys.
        """
        content = response.css('article ::text').getall()
        content_text = ' '.join(content).lower() if content else description.lower()
        
        for pattern in self.CLOSING_DATE_PATTERNS:
            match = re.search(pattern, content_text, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                try:
                    # Handle different pattern formats
                    if len(groups) == 3:
                        # Either (day, month_name, year) or (day, month_num, year)
                        day = int(groups[0])
                        month_str = groups[1].lower()
                        year = int(groups[2])
                        
                        # Check if month is a name or number
                        if month_str in self.MONTH_MAP:
                            month = self.MONTH_MAP[month_str]
                        else:
                            month = int(month_str)
                        
                        # Validate date
                        if 1 <= day <= 31 and 1 <= month <= 12 and 2024 <= year <= 2030:
                            parsed_date = f"{year:04d}-{month:02d}-{day:02d}"
                            raw_date = match.group(0)
                            
                            return {
                                'raw': raw_date,
                                'parsed': parsed_date,
                            }
                except (ValueError, IndexError) as e:
                    self.logger.debug(f"Date parsing error: {e} for match: {match.group(0)}")
                    continue
        
        return None

    def _extract_application_url(self, response):
        """
        Extract external application URL from content.
        Look for "Apply here", "Click to apply", or direct job portal links.
        """
        # Look for explicit "apply" links
        apply_links = (
            response.css('a[href*="apply"]::attr(href)').getall() +
            response.css('a[href*="careers"]::attr(href)').getall() +
            response.css('a[href*="jobs"]::attr(href)').getall() +
            response.css('a:contains("Apply")::attr(href)').getall() +
            response.css('a:contains("Click here")::attr(href)').getall()
        )
        
        # Filter to external links (not studentroom.co.za)
        external_links = [
            link for link in apply_links 
            if link and 'studentroom.co.za' not in link.lower()
        ]
        
        # Prioritize known career portal domains
        priority_domains = [
            'bmwgroup.jobs', 'eskom.co.za', 'careers', 'workday', 
            'successfactors', 'taleo', 'smartrecruiters', 'linkedin.com/jobs',
            'indeed', 'pnet', 'careers24', 'gov.za'
        ]
        
        for domain in priority_domains:
            for link in external_links:
                if domain in link.lower():
                    return link
        
        # Return first external link if no priority domain found
        if external_links:
            return external_links[0]
        
        return None

    def _extract_eligibility(self, description):
        """
        Extract eligibility criteria from description.
        Returns a dictionary of extracted criteria.
        """
        if not description:
            return {}
        
        eligibility = {}
        desc_lower = description.lower()
        
        # Extract age requirements
        age_pattern = re.search(
            r'(?:aged?|between)\s*(\d{1,2})\s*(?:to|and|-)\s*(\d{1,2})\s*(?:years?)?',
            desc_lower
        )
        if age_pattern:
            eligibility['age_min'] = int(age_pattern.group(1))
            eligibility['age_max'] = int(age_pattern.group(2))
        
        # Check for citizenship requirements
        if 'south african' in desc_lower or 'sa citizen' in desc_lower:
            eligibility['citizenship'] = 'South African'
        
        # Check for unemployment requirement
        if 'unemployed' in desc_lower:
            eligibility['employment_status'] = 'unemployed'
        
        # Check for disability inclusion
        if 'disability' in desc_lower or 'disabled' in desc_lower:
            eligibility['disability_friendly'] = True
        
        # Check for gender preferences
        if 'female' in desc_lower and 'male' not in desc_lower.replace('female', ''):
            eligibility['gender_preference'] = 'female'
        
        return eligibility

    def _extract_required_documents(self, description):
        """
        Extract list of required documents from description.
        """
        if not description:
            return []
        
        documents = []
        desc_lower = description.lower()
        
        document_keywords = {
            'cv': ['cv', 'curriculum vitae', 'resume'],
            'id_document': ['id', 'identity document', 'id copy', 'id document'],
            'matric_certificate': ['matric', 'matric certificate', 'grade 12'],
            'academic_transcript': ['transcript', 'academic record', 'academic transcript'],
            'qualification_certificate': ['certificate', 'diploma', 'degree certificate'],
            'proof_of_residence': ['proof of residence', 'proof of address'],
            'bank_statement': ['bank statement'],
            'tax_clearance': ['tax clearance'],
        }
        
        for doc_type, keywords in document_keywords.items():
            for keyword in keywords:
                if keyword in desc_lower:
                    if doc_type not in documents:
                        documents.append(doc_type)
                    break
        
        return documents

    def _extract_contacts(self, content):
        """
        Extract email addresses and phone numbers.
        """
        if not content: return {}
        
        emails = set(re.findall(r'[\w\.-]+@[\w\.-]+\.\w{2,}', content))
        # Basic cellphone pattern (South Africa)
        phones = set(re.findall(r'(?:\+27|0)\s?\d{2}\s?\d{3}\s?\d{4}', content))
        
        return {
            'emails': list(emails),
            'phones': list(phones)
        }

    def _extract_salary(self, content):
        """
        Extract salary information if present (e.g., R5000 pm).
        """
        if not content: return None
        
        # Look for "Stipend: Rxxx" or "Salary: Rxxx"
        match = re.search(r'(?:stipend|salary|remuneration)[:\s]+(R\s?[\d,\s]+(?:\.\d{2})?(?:\s?-\s?R\s?[\d,\s]+)?(?:\s?(?:p\.m\.|per month|p\.a\.|per annum|monthly))?)', content, re.IGNORECASE)
        if match:
             return match.group(1).strip()
             
        return None

    def _detect_sector(self, text):
        text = text.lower()
        sectors = {
            'engineering': ['engineer', 'mechanic', 'fitter', 'turner', 'electrical', 'civil', 'technician'],
            'mining': ['mine', 'mining', 'underground', 'rock', 'colliery'],
            'it': ['developer', 'software', 'data', 'analyst', 'network', 'support', 'computer'],
            'finance': ['account', 'finance', 'audit', 'tax', 'bookkeeper', 'ca(sa)', 'bank'],
            'government': ['municipality', 'department', 'state', 'public', 'saps', 'sandf'],
            'retail': ['store', 'retail', 'sales', 'merchandiser', 'cashier', 'shop'],
            'logistics': ['driver', 'warehouse', 'logistics', 'transport', 'supply chain'],
            'healthcare': ['nurse', 'hospital', 'clinic', 'medical', 'pharmacy', 'doctor'],
            'education': ['teacher', 'educator', 'school', 'lecturer', 'campus']
        }
        for sector, keywords in sectors.items():
            if any(k in text for k in keywords):
                return sector
        return 'general'

    def _generate_fingerprint(self, title, company):
        # Create a unique ID based on Title + Company (normalized)
        raw = f"{title.lower().strip()}|{company.lower().strip()}"
        return hashlib.md5(raw.encode()).hexdigest()

    def _extract_structured_requirements(self, response):
        """
        Extract structured requirements from StudentRoom pages.
        Many StudentRoom posts have clear sections for Minimum vs Ideal requirements.
        Returns dict with qualifications, experience, skills, knowledge, conditions.
        """
        result = {
            'qualifications': {'minimum': {}, 'ideal': {}},
            'experience': {'minimum': {}, 'ideal': {}},
            'skills': [],
            'knowledge': {'minimum': [], 'ideal': []},
            'conditions_of_employment': []
        }
        
        # Get all text content with structure preserved
        content_parts = response.css('article .entry-content, article .post-content, article .content').getall()
        if not content_parts:
            return result
        
        full_html = ' '.join(content_parts)
        full_text = ' '.join(response.css('article *::text').getall())
        
        # Extract Minimum Qualifications
        min_qual_patterns = [
            r'(?:Qualifications?\s*\(Minimum\)|Minimum\s*Qualifications?)[:\s]*(.*?)(?=(?:Qualifications?\s*\(Ideal\)|Experience|Skills|###|##|\n\n\n))',
            r'(?:Minimum[:\s]+)(.*?)(?:Grade\s*12|Matric|Diploma|Degree|Bachelor|National Certificate)(.*?)(?=(?:Ideal|Experience|Skills|###))',
        ]
        
        for pattern in min_qual_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                min_text = match.group(0)
                
                # Detect degree level
                if 'grade 12' in min_text.lower() or 'matric' in min_text.lower() or 'national certificate' in min_text.lower():
                    result['qualifications']['minimum']['degree_level'] = 'Matric'
                elif 'diploma' in min_text.lower():
                    result['qualifications']['minimum']['degree_level'] = 'Diploma'
                elif 'bachelor' in min_text.lower() or 'degree' in min_text.lower():
                    result['qualifications']['minimum']['degree_level'] = 'Bachelors'
                
                # Extract field of study
                field_match = re.search(r'(?:in|of)\s+([A-Z][a-zA-Z\s,&]+?)(?:\.|$|\n|or)', min_text)
                if field_match:
                    result['qualifications']['minimum']['field_of_study'] = field_match.group(1).strip()
                
                break
        
        # Extract Ideal Qualifications
        ideal_qual_patterns = [
            r'(?:Qualifications?\s*\(Ideal\)|Ideal\s*Qualifications?|Preferred\s*Qualifications?)[:\s]*(.*?)(?=(?:Experience|Skills|Knowledge|###|##|\n\n\n))',
        ]
        
        for pattern in ideal_qual_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                ideal_text = match.group(0)
                
                # Detect degree level
                if 'diploma' in ideal_text.lower() and 'bachelor' not in ideal_text.lower():
                    result['qualifications']['ideal']['degree_level'] = 'Diploma'
                elif 'bachelor' in ideal_text.lower() or 'degree' in ideal_text.lower():
                    result['qualifications']['ideal']['degree_level'] = 'Bachelors'
                elif 'honours' in ideal_text.lower():
                    result['qualifications']['ideal']['degree_level'] = 'Honours'
                elif 'master' in ideal_text.lower():
                    result['qualifications']['ideal']['degree_level'] = 'Masters'
                
                # Extract field of study
                field_match = re.search(r'(?:in|of)\s+([A-Z][a-zA-Z\s,&]+?)(?:\.|$|\n|or)', ideal_text)
                if field_match:
                    result['qualifications']['ideal']['field_of_study'] = field_match.group(1).strip()
                
                # Extract certifications
                cert_match = re.search(r'(?:Certification|Certificate)\s+in\s+([A-Z][a-zA-Z\s,&]+)', ideal_text, re.IGNORECASE)
                if cert_match:
                    result['qualifications']['ideal']['certifications'] = [cert_match.group(1).strip()]
                
                break
        
        # Extract Minimum Experience
        min_exp_patterns = [
            r'(?:Experience\s*\(Minimum\)|Minimum\s*Experience)[:\s]*(.*?)(?=(?:Experience\s*\(Ideal\)|Ideal|Skills|Qualifications|###))',
            r'(\d+(?:\s*to\s*|\s*-\s*)\d+)\s*(?:months?|years?)\s+(?:.*?(?:experience|exp).*?)(?=(?:Ideal|Skills|OR|###|\n\n))',
        ]
        
        for pattern in min_exp_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                exp_text = match.group(0)
                
                # Extract years/months
                years_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:to|-)?\s*(\d+(?:\.\d+)?)?\s*(years?|months?)', exp_text, re.IGNORECASE)
                if years_match:
                    min_val = float(years_match.group(1))
                    max_val = float(years_match.group(2)) if years_match.group(2) else min_val
                    unit = years_match.group(3).lower()
                    
                    if 'month' in unit:
                        # Convert months to years
                        result['experience']['minimum']['years_min'] = round(min_val / 12, 1)
                        result['experience']['minimum']['years_max'] = round(max_val / 12, 1)
                    else:
                        result['experience']['minimum']['years_min'] = min_val
                        result['experience']['minimum']['years_max'] = max_val
                
                # Store description
                result['experience']['minimum']['description'] = self._clean_text(exp_text[:200])
                break
        
        # Extract Ideal Experience
        ideal_exp_patterns = [
            r'(?:Experience\s*\(Ideal\)|Ideal\s*Experience|Preferred\s*Experience)[:\s]*(.*?)(?=(?:Skills|Knowledge|Qualifications|###))',
            r'(?:More than|>\s*)\s*(\d+)\s*(years?)\s+(?:.*?experience.*?)(?=(?:Skills|###|\n\n))',
        ]
        
        for pattern in ideal_exp_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                exp_text = match.group(0)
                
                # Extract years
                years_match = re.search(r'(?:more than|>\s*)?(\d+(?:\.\d+)?)\s*(years?|months?)', exp_text, re.IGNORECASE)
                if years_match:
                    val = float(years_match.group(1))
                    unit = years_match.group(2).lower()
                    
                    if 'month' in unit:
                        result['experience']['ideal']['years_min'] = round(val / 12, 1)
                    else:
                        result['experience']['ideal']['years_min'] = val
                
                # Store description
                result['experience']['ideal']['description'] = self._clean_text(exp_text[:200])
                break
        
        # Extract Skills
        skills_patterns = [
            r'(?:Skills?\s*Required|Required\s*Skills?)[:\s]*(.*?)(?=(?:Conditions|Knowledge|###|\n\n\n))',
        ]
        
        for pattern in skills_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                skills_text = match.group(1)
                
                # Common skill patterns
                skill_items = re.findall(r'[-•]\s*([A-Z][^\n•-]+?)(?=\n|$|•|-)', skills_text)
                if skill_items:
                    result['skills'] = [{'name': self._clean_text(s), 'level': 'required'} for s in skill_items if len(s.strip()) > 3]
                else:
                    # Try finding skills in sentence format
                    if 'communication' in skills_text.lower():
                        result['skills'].append({'name': 'Communication Skills', 'level': 'required'})
                    if 'interpersonal' in skills_text.lower():
                        result['skills'].append({'name': 'Interpersonal Skills', 'level': 'required'})
                    if 'computer literacy' in skills_text.lower() or 'ms word' in skills_text.lower():
                        result['skills'].append({'name': 'Computer Literacy', 'level': 'required'})
                        if 'ms word' in skills_text.lower():
                            result['skills'].append({'name': 'MS Word', 'level': 'required'})
                        if 'ms excel' in skills_text.lower():
                            result['skills'].append({'name': 'MS Excel', 'level': 'required'})
                        if 'ms outlook' in skills_text.lower():
                            result['skills'].append({'name': 'MS Outlook', 'level': 'required'})
                
                break
        
        # Extract Knowledge Requirements
        knowledge_patterns = [
            r'(?:Knowledge\s*Requirements?|Required\s*Knowledge)[:\s]*(.*?)(?=(?:Skills|Conditions|###|\n\n\n))',
        ]
        
        for pattern in knowledge_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                knowledge_text = match.group(0)
                
                # Split into minimum and ideal
                min_knowledge_match = re.search(r'(?:Minimum\s*Knowledge)[:\s]*(.*?)(?=(?:Ideal|###))', knowledge_text, re.IGNORECASE | re.DOTALL)
                if min_knowledge_match:
                    min_items = re.findall(r'[-•]\s*([A-Z][^\n•-]+?)(?=\n|$|•|-)', min_knowledge_match.group(1))
                    result['knowledge']['minimum'] = [self._clean_text(k) for k in min_items if len(k.strip()) > 3]
                
                ideal_knowledge_match = re.search(r'(?:Ideal\s*Knowledge)[:\s]*(.*?)(?=(?:Skills|###|\n\n))', knowledge_text, re.IGNORECASE | re.DOTALL)
                if ideal_knowledge_match:
                    ideal_items = re.findall(r'[-•]\s*([A-Z][^\n•-]+?)(?=\n|$|•|-)', ideal_knowledge_match.group(1))
                    result['knowledge']['ideal'] = [self._clean_text(k) for k in ideal_items if len(k.strip()) > 3]
                
                break
        
        # Extract Conditions of Employment
        conditions_patterns = [
            r'(?:Conditions?\s*of\s*Employment)[:\s]*(.*?)(?=(?:How to Apply|Why|###|\n\n\n))',
        ]
        
        for pattern in conditions_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
            if match:
                conditions_text = match.group(1)
                
                # Extract conditions as list items
                condition_items = re.findall(r'[-•]\s*([A-Z][^\n•-]+?)(?=\n|$|•|-)', conditions_text)
                if condition_items:
                    result['conditions_of_employment'] = [self._clean_text(c) for c in condition_items if len(c.strip()) > 3]
                else:
                    # Try sentence-based extraction
                    if 'criminal' in conditions_text.lower() and 'clear' in conditions_text.lower():
                        result['conditions_of_employment'].append('Clear criminal record')
                    if 'credit' in conditions_text.lower() and 'clear' in conditions_text.lower():
                        result['conditions_of_employment'].append('Clear credit record')
                    if 'fingerprint' in conditions_text.lower():
                        result['conditions_of_employment'].append('Detectable fingerprints')
                
                break
        
        # Extract Application URL (explicit "Click here to apply" links)
        # This catches links that the generic extract_best_link might miss
        apply_link_patterns = [
            r'(?:click\s+here\s+to\s+apply|apply\s+now|apply\s+here|submit\s+application)',
        ]
        
        # Find all links in the page with "apply" context
        for link_elem in response.css('a[href^="http"]'):
            href = link_elem.css('::attr(href)').get()
            link_text = ''.join(link_elem.css('::text').getall()).lower()
            
            if not href:
                continue
            
            # Check if link text suggests this is an application link
            for pattern in apply_link_patterns:
                if re.search(pattern, link_text, re.IGNORECASE):
                    # Avoid aggregator domains
                    from utils.link_validator import is_aggregator_domain, is_trusted_company_domain
                    if not is_aggregator_domain(href):
                        result['application_url'] = href
                        self.logger.info(f"Found application URL via structured extraction: {href}")
                        break
            if result.get('application_url'):
                break
        
        return result

    def _extract_expiry_signals(self, response, text_clean, closing_date_parsed):
        """
        Extract signals that indicate the opportunity may be closed/expired.
        Returns list of signal strings for AI pipeline status detection.
        """
        signals = []
        
        # 1. Check for CLOSED/EXPIRED badges in HTML
        closed_badges = response.css('.badge-closed, .expired, .closed, .status-closed, .vacancy-closed').getall()
        if closed_badges:
            signals.append('closed_badge')
        
        # 2. Check for expiry indicators in CSS classes
        article_classes = response.css('article::attr(class)').get() or ''
        if 'expired' in article_classes.lower() or 'closed' in article_classes.lower():
            signals.append('expired_class')
        
        # 3. Keyword detection in text
        expiry_keywords = [
            'applications closed', 'vacancy filled', 'position filled',
            'no longer accepting', 'expired', 'recruitment completed',
            'this vacancy has closed', 'applications have closed'
        ]
        for keyword in expiry_keywords:
            if keyword in text_clean:
                signals.append(f'keyword:{keyword}')
                break
        
        # 4. Check post age (if no deadline and old post)
        if not closing_date_parsed:
            pub_date_meta = response.css('meta[property="article:published_time"]::attr(content)').get()
            if pub_date_meta:
                try:
                    pub_date = datetime.fromisoformat(pub_date_meta.replace('Z', '+00:00'))
                    days_old = (datetime.now(pub_date.tzinfo) - pub_date).days
                    if days_old > 90:
                        signals.append(f'old_post:{days_old}_days')
                except Exception:
                    pass
        
        return signals if signals else []
