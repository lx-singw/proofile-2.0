"""
RecentJobs.co.za Spider - General Opportunity Spider (Jan 2026)
Scrapes jobs, learnerships, and internships from recentjobs.co.za.
Refined to match the comprehensiveness of StudentRoomSpider.

Site Structure:
- Standard WordPress blog layout
- Homepage lists mixed opportunities
- Detail pages contain full specs
"""
import scrapy
import re
import json
import hashlib
from datetime import datetime
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link

class RecentJobsSpider(scrapy.Spider):
    name = 'recentjobs'
    allowed_domains = ['recentjobs.co.za']
    
    start_urls = [
        'https://recentjobs.co.za/',
        'https://recentjobs.co.za/category/vacancies/',
        'https://recentjobs.co.za/category/jobs/',
        'https://recentjobs.co.za/category/learnerships/',
        'https://recentjobs.co.za/category/internships/',
        'https://recentjobs.co.za/category/apprenticeships/',
        'https://recentjobs.co.za/category/bursaries/',
        'https://recentjobs.co.za/category/government-jobs/',
    ]
    
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,  # Conservative for reliability
        'COOKIES_ENABLED': False,
        'ROBOTSTXT_OBEY': False,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en;q=0.9,en-US;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        },
        'RETRY_TIMES': 3,
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
        'CLOSESPIDER_PAGECOUNT': 100,
    }
    
    max_pages = 50
    pages_crawled = 0
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'max_pages' in kwargs:
            self.max_pages = int(kwargs['max_pages'])
    
    # Regex patterns for closing date extraction
    CLOSING_DATE_PATTERNS = [
        r'closing\s*date[:\s]+(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        r'application\s*deadline[:\s]+(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        r'applications?\s*close[ds]?\s*(?:on)?\s*[:\s]*(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})',
        r'deadline[:\s]+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})',
        r'clos(?:e|ing)\s*date[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
        r'\b(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})\b',
    ]

    MONTH_MAP = {
        'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
        'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
        'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'october': 10, 'oct': 10,
        'november': 11, 'nov': 11, 'december': 12, 'dec': 12,
    }

    SA_PROVINCES = [
        'gauteng', 'western cape', 'kwazulu-natal', 'kwazulu natal', 'kzn',
        'eastern cape', 'free state', 'limpopo', 'mpumalanga', 'north west',
        'northern cape'
    ]

    SA_CITIES = [
        'johannesburg', 'cape town', 'durban', 'pretoria', 'port elizabeth',
        'bloemfontein', 'east london', 'nelspruit', 'polokwane', 'kimberley',
        'midrand', 'sandton', 'centurion', 'soweto', 'rustenburg', 'pietermaritzburg'
    ]

    def parse(self, response):
        """
        Parse list pages (homepage, category pages, pagination pages).
        """
        self.logger.info(f"Parsing list page: {response.url} - Status: {response.status}")
        self.pages_crawled += 1
        
        # Standard WordPress selectors
        cards = response.css('article') or response.css('.post') or response.css('.type-post')
        
        for card in cards:
            link = card.css('h2 a::attr(href)').get() or card.css('.entry-title a::attr(href)').get() or card.css('a.more-link::attr(href)').get()
            
            if not link:
                continue
                
            # Skip non-opportunity posts
            if any(x in link for x in ['/page/', '/category/', '/tag/', '/author/']):
                continue

            item = OpportunityItem()
            item['source_platform'] = 'recentjobs'
            
            # Initial Title Extraction for Type Detection
            title = card.css('h2 a::text').get() or card.css('.entry-title a::text').get() or card.css('.entry-title::text').get()
            if title:
                item['title'] = self._clean_text(title)
                item['type'] = self._detect_type(f"{item['title']} {link}")
            
            # Follow to detail page
            yield scrapy.Request(
                link, 
                callback=self.parse_detail, 
                meta={
                    'item': item,
                    'category': self._extract_category_from_url(response.url),
                    'list_url': response.url
                },
                priority=1
            )
            
        # Pagination
        if self.pages_crawled < self.max_pages:
            next_page = response.css('.nav-links a.next::attr(href)').get() or \
                        response.css('.pagination a.next::attr(href)').get() or \
                        response.css('a.next::attr(href)').get()
            if next_page:
                self.logger.info(f"Following pagination to: {next_page}")
                yield scrapy.Request(next_page, callback=self.parse, priority=0)

    def parse_detail(self, response):
        """
        Parse the full opportunity detail page with comprehensive extraction.
        """
        item = response.meta.get('item', OpportunityItem())
        original_url = response.url
        
        # Update Title if missing or empty
        if not item.get('title'):
            title = response.css('h1::text').get() or response.css('.entry-title::text').get()
            if title:
                item['title'] = self._clean_text(title)
                if not item.get('type'):
                    item['type'] = self._detect_type(title)

        # Extract full content
        content_selectors = ['.entry-content', '.post-content', 'article']
        content_html = None
        content_text = ""
        
        for sel in content_selectors:
            if response.css(sel):
                content_html = response.css(sel).get()
                content_text = " ".join(response.css(f'{sel} ::text').getall())
                break
        
        if not content_text:
            content_text = " ".join(response.css('p::text').getall())

        if content_text:
            text_clean = self._clean_text(content_text)
            item['description_full'] = text_clean[:10000]
            item['description_short'] = text_clean[:300]
            
            # Extract Core Fields
            item['company'] = self._extract_company(item.get('title', ''), text_clean)
            item['location'] = self._extract_location(text_clean)
            
            # Advanced Extraction
            closing_date = self._extract_closing_date(text_clean)
            external_url = self._extract_application_url(response)
            eligibility = self._extract_eligibility(text_clean)
            required_documents = self._extract_required_documents(text_clean)
            salary = self._extract_salary(text_clean)
            contacts = self._extract_contacts(text_clean)
            sector = self._detect_sector(text_clean)
            is_pdf = external_url.lower().endswith('.pdf') if external_url else False
            fingerprint = self._generate_fingerprint(item.get('title', ''), item.get('company', ''))
            
            # NEW: Additional extractions
            reference_number = self._extract_reference_number(text_clean, item.get('title', ''))
            positions_count = self._extract_positions_count(text_clean)
            published_date = self._extract_published_date(original_url)
            education_level = self._extract_education_level(text_clean)
            experience_years = self._extract_experience_years(text_clean)
            application_method = self._extract_application_method(text_clean, has_url=bool(external_url))
            expiry_signals = self._extract_expiry_signals(
                response,
                text_clean.lower(),
                closing_date['parsed'] if closing_date else None
            )
            
            # Set original_url to application link if found (standard practice)
            # But keep tracking source
            # ENHANCED: Use link validator for proper canonical link extraction
            # This provides context-aware extraction (looks for links near "How to Apply" text)
            external_url_validated, link_quality = extract_best_link(response, {})
            is_company_link = is_canonical_link(external_url_validated)
            
            # Fallback to old method if link validator doesn't find anything good
            if not is_company_link or link_quality in ['aggregator_fallback', 'aggregator_with_email_hint']:
                fallback_url = self._extract_application_url(response)
                if fallback_url and is_canonical_link(fallback_url):
                    external_url_validated = fallback_url
                    is_company_link = True
                    link_quality = 'legacy_extraction'
            
            # Set URLs appropriately
            item['canonical_link'] = external_url_validated if is_company_link else original_url
            item['source_url'] = original_url  # Where we found it (aggregator page)
            item['is_direct_company_link'] = is_company_link
            item['link_quality'] = link_quality
            item['original_url'] = item['canonical_link']  # For backwards compatibility
            if closing_date:
                item['closing_date'] = closing_date['parsed']
                item['application_deadline'] = closing_date['parsed']
            if salary:
                item['salary'] = salary
            if contacts.get('emails'):
                item['contact_email'] = contacts['emails'][0]
            if contacts.get('phones'):
                item['contact_phone'] = contacts['phones'][0]
            if application_method:
                item['application_method'] = application_method.get('method') if isinstance(application_method, dict) else application_method
            
            # Build Raw Data for AI Pipeline
            raw_data = {
                'recentjobs_url': original_url,
                'application_url': external_url_validated if is_company_link else None,
                'closing_date_raw': closing_date['raw'] if closing_date else None,
                'closing_date_parsed': closing_date['parsed'] if closing_date else None,
                'eligibility': eligibility,
                'required_documents': required_documents,
                'scraped_at': datetime.utcnow().isoformat(),
                'salary': salary,
                'contacts': contacts,
                'sector': sector,
                'is_pdf_application': is_pdf,
                'dedup_fingerprint': fingerprint,
                'html_snippet': content_html[:5000] if content_html else "",
                'category': response.meta.get('category', 'unknown'),
                'list_page_url': response.meta.get('list_url', ''),
                # NEW: Additional extracted fields
                'reference_number': reference_number,
                'positions_count': positions_count,
                'published_date': published_date,
                'education_level': education_level,
                'experience_years': experience_years,
                'application_method': application_method,
                'expiry_signals': expiry_signals,
                # Quality signals for AI confidence scoring
                'quality_signals': {
                    'has_closing_date': bool(closing_date),
                    'has_company': item.get('company') != 'Unknown',
                    'has_contact': bool(contacts.get('emails') or contacts.get('phones')) if contacts else False,
                    'has_external_url': bool(external_url_validated) and is_company_link,
                    'description_length': len(text_clean),
                    'has_salary': bool(salary),
                    'has_location': item.get('location') != 'South Africa',
                    'has_reference': bool(reference_number),
                    'has_education_level': bool(education_level),
                    'link_quality': link_quality,
                }
            }
            item['raw_data'] = json.dumps(raw_data)
            
            # Validate before yielding
            if self._validate_item(item):
                yield item
            else:
                self.logger.warning(f"Skipping invalid item: {item.get('title', 'NO_TITLE')}")
    
    def _extract_with_fallback(self, response, selectors, field_name, extractor='::text'):
        """
        Safely extract data using multiple fallback selectors.
        Returns cleaned text or None.
        """
        for selector in selectors:
            try:
                if extractor == '::text':
                    result = response.css(f'{selector}::text').get()
                elif extractor == '::attr(href)':
                    result = response.css(f'{selector}::attr(href)').get()
                else:
                    result = response.css(selector).get()
                
                if result and result.strip():
                    return self._clean_text(result)
            except Exception as e:
                self.logger.debug(f"Selector '{selector}' failed for {field_name}: {e}")
                continue
        
        self.logger.debug(f"All selectors failed for {field_name}")
        return None
    
    def _validate_item(self, item):
        """
        Validate that an item has all required fields before saving.
        Returns True if valid, False otherwise.
        """
        required_fields = ['title', 'original_url', 'source_platform']
        
        for field in required_fields:
            if not item.get(field):
                self.logger.error(f"Missing required field '{field}' in item: {item.get('title', 'UNKNOWN')}")
                return False
        
        # Validate title quality
        title = item.get('title', '')
        if len(title) < 10 or len(title) > 500:
            self.logger.warning(f"Invalid title length ({len(title)}): {title[:50]}...")
            return False
        
        # Validate URL format
        url = item.get('original_url', '')
        if not url.startswith('http'):
            self.logger.error(f"Invalid URL format: {url}")
            return False
        
        return True

    # =========================================================================
    # HELPER METHODS (Ported and Adapted vs StudentRoomSpider)
    # =========================================================================

    # =========================================================================
    # HELPER METHODS (Ported and Adapted vs StudentRoomSpider)
    # =========================================================================

    def _clean_text(self, text):
        return " ".join(text.split()).strip() if text else ""

    def _detect_type(self, text):
        text = text.lower()
        if 'bursary' in text or 'bursaries' in text: return 'bursary'
        if 'internship' in text or 'intern' in text: return 'internship'
        if 'learnership' in text: return 'learnership'
        if 'apprentice' in text: return 'apprenticeship'
        if 'graduate' in text: return 'graduate_program'
        if 'trainee' in text: return 'training_program'
        return 'job'
    
    def _extract_category_from_url(self, url):
        """
        Extract category name from URL for metadata tracking.
        """
        url_lower = url.lower()
        
        if '/category/bursaries' in url_lower:
            return 'bursaries'
        elif '/category/internships' in url_lower or '/category/internship' in url_lower:
            return 'internships'
        elif '/category/learnerships' in url_lower or '/category/learnership' in url_lower:
            return 'learnerships'
        elif '/category/apprenticeships' in url_lower:
            return 'apprenticeships'
        elif '/category/government-jobs' in url_lower:
            return 'government_jobs'
        elif '/category/jobs' in url_lower or '/category/vacancies' in url_lower:
            return 'jobs'
        
        return 'general'

    def _extract_company(self, title, content):
        if not title: return "Unknown"
        
        # 1. Try title prefix "Company: Job" or "Company Job"
        # Remove common suffixes
        clean = re.sub(r'(vacancies|jobs|internships|bursaries|learnerships|programmes|apprenticeships).*', '', title, flags=re.IGNORECASE).strip()
        
        # Remove "South Africa" etc
        clean = re.sub(r'\s+(SA|South Africa|Pty|Ltd|Limited|Group)$', '', clean, flags=re.IGNORECASE).strip(' -–')
        
        if len(clean) > 2 and len(clean) < 50:
            return clean
            
        # 2. Try content "at [Company]"
        match = re.search(r'\b(?:at|by|from)\s+([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Group|SA)?)\b', content)
        if match:
             return match.group(1).strip()
             
        return "Unknown"

    def _extract_location(self, content):
        content = content.lower()
        # Check specific pattern first to prefer city/suburb over broad province mentions
        match = re.search(r'location[:\s]+([A-Za-z\s,]+?)(?:\.|$|\n)', content, re.IGNORECASE)
        if match:
            extracted = match.group(1).strip().title()
            if extracted:
                return extracted

        # Check Provinces first
        for prov in self.SA_PROVINCES:
            if prov in content: return prov.title()
        
        # Check Cities
        for city in self.SA_CITIES:
            if city in content: return city.title()

        return "South Africa"

    def _extract_closing_date(self, content):
        """
        Returns dict {'raw': str, 'parsed': str (YYYY-MM-DD)}
        """
        for pattern in self.CLOSING_DATE_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                groups = match.groups()
                try:
                    if len(groups) == 3:
                        day, month_str, year = groups
                        month = int(month_str) if month_str.isdigit() else self.MONTH_MAP.get(month_str.lower(), 1)
                        return {
                            'raw': match.group(0),
                            'parsed': f"{int(year):04d}-{month:02d}-{int(day):02d}"
                        }
                except (TypeError, ValueError):
                    continue
        return None

    def _extract_application_url(self, response):
        """
        Extract external application URL from content.
        """
        apply_links = (
            response.css('a[href*="apply"]::attr(href)').getall() +
            response.css('a[href*="careers"]::attr(href)').getall() +
            response.css('a[href*="jobs"]::attr(href)').getall() +
            response.css('a:contains("Apply")::attr(href)').getall() +
            response.css('a:contains("Click here")::attr(href)').getall() +
            response.css('.entry-content a::attr(href)').getall() # Catch-all for blog posts often linking out
        )
        
        # Filter own domain
        external_links = [
            link for link in apply_links 
            if link and link.startswith('http') and 'recentjobs.co.za' not in link.lower()
        ]
        
        # Priority domains
        priority = ['workday', 'taleo', 'smartrecruiters', 'linkedin', 'pnet', 'careers24', 'gov.za']
        for p in priority:
            for link in external_links:
                if p in link.lower():
                    return link
                    
        return external_links[0] if external_links else None

    def _extract_eligibility(self, description):
        if not description: return {}
        eligibility = {}
        desc_lower = description.lower()
        
        # Age
        match = re.search(r'(?:aged?|between)\s*(\d{1,2})\s*(?:to|and|-)\s*(\d{1,2})', desc_lower)
        if match:
            eligibility['age_min'] = int(match.group(1))
            eligibility['age_max'] = int(match.group(2))
            
        if 'south african' in desc_lower or 'sa citizen' in desc_lower:
            eligibility['citizenship'] = 'South African'
            
        if 'unemployed' in desc_lower:
            eligibility['employment_status'] = 'unemployed'
            
        if 'disability' in desc_lower:
            eligibility['disability_friendly'] = True
            
        return eligibility
        
    def _extract_required_documents(self, description):
        if not description: return []
        documents = []
        desc_lower = description.lower()
        
        keywords = {
            'cv': ['cv', 'curriculum vitae', 'resume'],
            'id': ['id document', 'id copy', 'identity document'],
            'matric': ['matric', 'grade 12', 'senior certificate'],
            'qualification': ['qualification', 'diploma', 'degree'],
            'transcript': ['transcript', 'academic record'],
            'proof_residence': ['proof of residence', 'proof of address']
        }
        
        for doc, keys in keywords.items():
            for k in keys:
                if k in desc_lower:
                    documents.append(doc)
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

    def _extract_reference_number(self, text, title=''):
        """
        Extract reference/job number from content.
        Examples: REF123, BAB251211-3, Reference: ABC123
        """
        if not text:
            return None
        
        patterns = [
            r'(?:ref(?:erence)?[\s:\.#]*)?([A-Z]{2,5}[\d]{4,8}(?:-\d+)?)',  # BAB251211-3
            r'(?:ref(?:erence)?|job\s*(?:no|number|id)?)[:\s\.#]+([A-Za-z0-9\-\/]+)',  # Reference: ABC123
            r'(?:vacancy|post|position)\s*(?:no|number|id)?[:\s\.#]+([A-Za-z0-9\-\/]+)',  # Vacancy No: 123
        ]
        
        combined = f"{title} {text[:2000]}"
        for pattern in patterns:
            match = re.search(pattern, combined, re.IGNORECASE)
            if match:
                ref = match.group(1).strip()
                if len(ref) >= 4 and len(ref) <= 20:
                    return ref
        return None

    def _extract_positions_count(self, text):
        """
        Extract number of available positions.
        Examples: '8 positions', 'X5', '3 vacancies'
        """
        if not text:
            return None
        
        patterns = [
            r'(\d+)\s*(?:positions?|posts?|vacancies|openings)',  # 8 positions
            r'[xX](\d+)',  # X5
            r'(?:positions?|posts?|vacancies)\s*(?:available)?[:\s]*(\d+)',  # Positions: 5
            r'(?:we\s+(?:have|are\s+hiring)|hiring)\s+(\d+)',  # We have 10
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text[:3000], re.IGNORECASE)
            if match:
                count = int(match.group(1))
                if 1 <= count <= 500:  # Sanity check
                    return count
        return None

    def _extract_published_date(self, url):
        """
        Extract published date from URL pattern.
        Example: /2025/12/03/job-title/ -> 2025-12-03
        """
        if not url:
            return None
        
        match = re.search(r'/(\d{4})/(\d{1,2})/(\d{1,2})/', url)
        if match:
            year, month, day = match.groups()
            try:
                return f"{year}-{int(month):02d}-{int(day):02d}"
            except ValueError:
                return None
        return None

    def _extract_education_level(self, text):
        """
        Extract minimum education requirement.
        """
        if not text:
            return None
        
        text_lower = text.lower()
        
        # Order matters - check higher qualifications first
        levels = [
            ('phd', ['phd', 'doctorate', 'doctoral']),
            ('masters', ['master', 'msc', 'mba', 'mcom', 'med']),
            ('honours', ['honours', 'honors', 'btech']),
            ('degree', ['degree', 'bachelor', 'bsc', 'bcom', 'ba']),
            ('diploma', ['diploma', 'national diploma', 'nd']),
            ('certificate', ['certificate', 'nqf', 'short course']),
            ('grade_12', ['grade 12', 'matric', 'senior certificate', 'nsc']),
            ('grade_10', ['grade 10', 'abet level']),
        ]
        
        for level, keywords in levels:
            if any(k in text_lower for k in keywords):
                return level
        return None

    def _extract_experience_years(self, text):
        """
        Extract experience requirement in years.
        Examples: '2-3 years', '5+ years', 'minimum 3 years'
        """
        if not text:
            return None
        
        patterns = [
            # Range with explicit context: "2-3 years experience", "2-3 yrs work"
            r'(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|working|work|exp)',
            
            # "Experience: 2-3 years"
            r'(?:experience|exp)[^0-9\n]{0,30}(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)',

            # Minimum with explicit context
            r'(?:minimum|at\s+least|min)[^0-9\n]{0,30}(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|working|work|exp)',
            
            # "3+ years experience" - stricter now
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|working|work|exp)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text[:3000], re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    return {'min': int(groups[0]), 'max': int(groups[1])}
                else:
                    years = int(groups[0])
                    if 0 <= years <= 30:
                        return {'min': years, 'max': None}
        return None

    def _extract_application_method(self, text, has_url=False):
        """
        Detect how to apply: email, online, in-person, post.
        Also extracts application instruction text for better context.
        """
        if not text:
            return None
        
        text_lower = text.lower()
        methods = []
        instructions = None
        
        # Try to extract "How to Apply" section text
        how_to_apply_match = re.search(
            r'(how\s+to\s+apply[:\s]*)([^\n]{0,500})',
            text,
            re.IGNORECASE
        )
        if how_to_apply_match:
            instructions = how_to_apply_match.group(2).strip()
        
        # Detect methods
        if 'email' in text_lower or '@' in text or 'send your cv' in text_lower:
            methods.append('email')
        
        if (has_url or 
            'online' in text_lower or 
            'portal' in text_lower or 
            'website' in text_lower or
            'click here' in text_lower or
            'apply here' in text_lower or
            'smartrecruiters' in text_lower or
            'workday' in text_lower or
            'application form' in text_lower):
            methods.append('online')
        
        if 'hand deliver' in text_lower or 'in person' in text_lower or 'walk-in' in text_lower:
            methods.append('in_person')
        
        if 'post' in text_lower or 'courier' in text_lower or 'p.o. box' in text_lower or 'postal' in text_lower:
            methods.append('post')
        
        # Return primary method (prioritize online > email > others)
        if 'online' in methods:
            return {'method': 'online', 'instructions': instructions}
        elif 'email' in methods:
            return {'method': 'email', 'instructions': instructions}
        elif methods:
            return {'method': methods[0], 'instructions': instructions}
        
        return None

    def _generate_fingerprint(self, title, company):
        """Generate dedup fingerprint for cross-source matching."""
        # Normalize title: lowercase, remove year, remove punctuation
        normalized_title = title.lower() if title else ''
        normalized_title = re.sub(r'\b20\d{2}\b', '', normalized_title)  # Remove year
        normalized_title = re.sub(r'[^\w\s]', '', normalized_title)  # Remove punctuation
        normalized_title = re.sub(r'\s+', ' ', normalized_title).strip()
        
        normalized_company = company.lower() if company else ''
        normalized_company = re.sub(r'[^\w\s]', '', normalized_company).strip()
        
        combined = f"{normalized_title}|{normalized_company}"
        return hashlib.md5(combined.encode()).hexdigest()

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
        
        # 2. Check for strikethrough/greyed styling (RecentJobs specific)
        title_element = response.css('h1.job-title, .job-heading')
        if title_element:
            style = title_element.css('::attr(style)').get() or ''
            classes = title_element.css('::attr(class)').get() or ''
            if 'line-through' in style or 'strikethrough' in classes.lower() or 'greyed' in classes.lower():
                signals.append('strikethrough')
        
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
        
        # 4. Check post age
        if not closing_date_parsed:
            pub_date_meta = response.css('meta[property="article:published_time"]::attr(content)').get()
            if pub_date_meta:
                try:
                    from datetime import datetime
                    pub_date = datetime.fromisoformat(pub_date_meta.replace('Z', '+00:00'))
                    days_old = (datetime.now(pub_date.tzinfo) - pub_date).days
                    if days_old > 90:
                        signals.append(f'old_post:{days_old}_days')
                except Exception:
                    pass
        
        return signals if signals else []

