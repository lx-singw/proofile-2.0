"""
PuffAndPass.co.za Spider - Opportunity Spider (Jan 2026)
Scrapes learnerships, internships, bursaries, and graduate programs from puffandpass.co.za.

Site Structure:
- WordPress-based blog layout
- Categories: learnerships, internships, bursaries, graduate programs
- Clean detail pages with structured requirements
"""
import scrapy
import re
import json
import hashlib
from datetime import datetime
from items import OpportunityItem
from utils.link_validator import extract_best_link, is_canonical_link

class PuffAndPassSpider(scrapy.Spider):
    name = 'puffandpass'
    allowed_domains = ['puffandpass.co.za']
    
    start_urls = [
        'https://www.puffandpass.co.za/',
        'https://www.puffandpass.co.za/category/learnerships/',
        'https://www.puffandpass.co.za/category/internships/',
        'https://www.puffandpass.co.za/category/bursaries/',
        'https://www.puffandpass.co.za/category/graduate-programs/',
        'https://www.puffandpass.co.za/category/grade-12/',
    ]
    
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'COOKIES_ENABLED': False,
        'ROBOTSTXT_OBEY': False,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en;q=0.9,en-US;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
        },
        'RETRY_TIMES': 3,
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
        'CLOSESPIDER_PAGECOUNT': 100,
    }
    
    max_pages = 50
    pages_crawled = 0
    
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
        
        # PuffAndPass uses article cards
        cards = response.css('article') or response.css('.post') or response.css('.item')
        
        # Method 1: Iterating over cards
        found_links = set()
        for card in cards:
            link = card.css('a::attr(href)').get() or card.css('h2 a::attr(href)').get()
            if link:
                if not link.startswith('http'):
                    link = response.urljoin(link)
                found_links.add(link)
        
        # Method 2: Fallback - Extract all links and filter by pattern
        if not found_links:
            self.logger.info("No cards found, using fallback link extraction")
            all_links = response.css('a::attr(href)').getall()
            for link in all_links:
                if not link: continue
                if not link.startswith('http'):
                    link = response.urljoin(link)
                
                # Filter for likely opportunity URLs (exclude categories, tags, etc)
                if 'puffandpass.co.za/' in link and \
                   '/category/' not in link and \
                   '/tag/' not in link and \
                   '/page/' not in link and \
                   '/templates/' not in link and \
                   'contact-us' not in link and \
                   'about-us' not in link:
                    # Specific exclusion for known static pages
                    if link.strip('/')[-1].isdigit() or '-' in link.split('/')[-1]:
                        found_links.add(link)

        self.logger.info(f"Found {len(found_links)} potential opportunity links")

        for link in found_links:
            # Skip non-opportunity pages (double check)
            skip_patterns = ['/templates/', '/contact', '/about', '/faq', '/howto', '/ordered', '/submissions', '/tag/', '/success-stories']
            if any(pattern in link for pattern in skip_patterns):
                continue
            
            # Skip category list pages
            if '/category/' in link:
                continue
                
            # Extract basic info from card is tricky if we just have links
            # We will fetch title in parse_detail
            item = OpportunityItem()
            item['title'] = '' # Will extract in detail page
            
            # Simple type detection from URL
            item['type'] = self._detect_type(link)
            
            # Follow to detail page
            yield response.follow(
                link,
                callback=self.parse_detail,
                meta={'item': item, 'list_page_url': response.url}
            )
        
        # Handle pagination
        if self.pages_crawled < self.max_pages:
            next_page = response.css('a.next::attr(href)').get() or \
                       response.css('.pagination a:contains("Next")::attr(href)').get() or \
                       response.css('.nav-links a.next::attr(href)').get()
            if next_page:
                yield response.follow(next_page, callback=self.parse)

    def parse_detail(self, response):
        """
        Parse the full opportunity detail page with comprehensive extraction.
        """
        item = response.meta.get('item', OpportunityItem())
        original_url = response.url
        
        # Extract title if not already present
        if not item.get('title'):
            item['title'] = response.css('h1::text').get() or \
                           response.css('.entry-title::text').get() or \
                           response.css('h2::text').get()
            if item['title']:
                item['title'] = self._clean_text(item['title'])
        
        # Full description from content area
        content_selectors = [
            '.entry-content', '.post-content', '.content', 'article .content',
            '.single-content', 'main article'
        ]
        description_parts = []
        for selector in content_selectors:
            parts = response.css(f'{selector} *::text').getall()
            if parts:
                description_parts = parts
                break
        
        description_full = ' '.join(description_parts)
        description_full = self._clean_text(description_full)
        item['description_full'] = description_full
        
        # Short description (first 500 chars)
        item['description_short'] = description_full[:500] if description_full else ''
        
        # Company extraction from title (e.g., "Eskom: Learnership Programme" -> "Eskom")
        item['company'] = self._extract_company(item.get('title', ''), description_full)
        
        # Location extraction
        item['location'] = self._extract_location(description_full)
        
        # Store URLs with link validation
        # ENHANCED: Use link validator for proper canonical link extraction
        external_url = self._extract_application_url(response)
        external_url_validated, link_quality = extract_best_link(response, {})
        is_company_link = is_canonical_link(external_url_validated)
        
        item['canonical_link'] = external_url_validated if is_company_link else external_url if external_url else original_url
        item['source_url'] = original_url  # Where we found it (aggregator page)
        item['is_direct_company_link'] = is_company_link
        item['link_quality'] = link_quality
        item['original_url'] = item['canonical_link']  # For backwards compatibility
        
        # HTML snippet for AI processing
        html_snippet = response.css('.entry-content').get() or response.css('article').get() or ''
        html_snippet = html_snippet[:4000] if html_snippet else ''
        
        # Clean text for extraction
        text_clean = description_full.lower() if description_full else ''
        
        # === ADVANCED EXTRACTIONS ===
        closing_date = self._extract_closing_date(text_clean)
        external_url = self._extract_application_url(response)
        eligibility = self._extract_eligibility(text_clean)
        required_docs = self._extract_required_documents(text_clean)
        salary = self._extract_salary(text_clean)
        contacts = self._extract_contacts(text_clean)
        sector = self._detect_sector(text_clean)
        category = self._extract_category_from_url(original_url)
        
        # NEW: Additional extractions
        reference_number = self._extract_reference_number(text_clean, item.get('title', ''))
        positions_count = self._extract_positions_count(text_clean)
        published_date = self._extract_published_date(original_url)
        education_level = self._extract_education_level(text_clean)
        experience_years = self._extract_experience_years(text_clean)
        application_method = self._extract_application_method(text_clean, has_url=bool(external_url))
        
        # NEW: Expiry signals for status detection
        expiry_signals = self._extract_expiry_signals(response, text_clean, closing_date.get('parsed'))
        
        # Build Raw Data for AI Pipeline
        raw_data = {
            'puffandpass_url': original_url,
            'application_url': external_url,
            'closing_date_raw': closing_date.get('raw'),
            'closing_date_parsed': closing_date.get('parsed'),
            'eligibility': eligibility,
            'required_documents': required_docs,
            'scraped_at': datetime.utcnow().isoformat(),
            'salary': salary,
            'contacts': contacts,
            'sector': sector,
            'category': category,
            'is_pdf_application': bool(external_url and '.pdf' in external_url.lower()),
            'dedup_fingerprint': self._generate_fingerprint(item.get('title', ''), item.get('company', '')),
            'html_snippet': html_snippet,
            # NEW fields
            'reference_number': reference_number,
            'positions_count': positions_count,
            'published_date': published_date,
            'education_level': education_level,
            'experience_years': experience_years,
            'application_method': application_method,
            # Expiry signals for verification
            'expiry_signals': expiry_signals,
            # Quality signals for AI confidence scoring
            'quality_signals': {
                'has_closing_date': bool(closing_date.get('parsed')),
                'has_company': bool(item.get('company') and item['company'] != 'Unknown'),
                'has_contact': bool(contacts.get('emails') or contacts.get('phones')),
                'has_external_url': bool(external_url),
                'description_length': len(description_full) if description_full else 0,
                'has_salary': bool(salary),
                'has_location': bool(item.get('location')),
                'has_reference': bool(reference_number),
                'has_education_level': bool(education_level),
            }
        }
        item['raw_data'] = json.dumps(raw_data)
        item['source_platform'] = 'puffandpass'
        
        # Validate and yield
        if self._validate_item(item):
            self.logger.info(f"Extracted: {item['title'][:50]}... | Type: {item['type']}")
            yield item
        else:
            self.logger.warning(f"Invalid item skipped: {response.url}")

    def _extract_with_fallback(self, response, selectors, field_name, extractor='::text'):
        """
        Safely extract data using multiple fallback selectors.
        """
        for selector in selectors:
            try:
                value = response.css(f'{selector}{extractor}').get()
                if value:
                    return self._clean_text(value)
            except Exception:
                continue
        return None

    def _validate_item(self, item):
        """
        Validate that an item has all required fields before saving.
        """
        if not item.get('title'):
            return False
        if not item.get('original_url'):
            return False
        if not item.get('description_full') or len(item['description_full']) < 100:
            return False
        
        # Skip certain patterns
        skip_patterns = ['how to apply', 'cv template', 'cover letter', 'tips and tricks']
        title_lower = item.get('title', '').lower()
        if any(pattern in title_lower for pattern in skip_patterns):
            return False
        
        return True

    def _clean_text(self, text):
        if not text:
            return ''
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[\r\n\t]+', ' ', text)
        return text.strip()

    def _detect_type(self, text):
        """
        Detect opportunity type from text.
        Order matters - more specific types should be checked first.
        """
        if not text:
            return 'opportunity'
        
        text = text.lower()
        
        # Check in order of specificity
        if 'bursary' in text or 'bursaries' in text or 'scholarship' in text:
            return 'bursary'
        elif 'learnership' in text or 'learnerships' in text:
            return 'learnership'
        elif 'apprentice' in text or 'apprenticeship' in text:
            return 'apprenticeship'
        elif 'internship' in text or 'intern ' in text or 'interns ' in text:
            return 'internship'
        elif 'graduate' in text and ('program' in text or 'programme' in text):
            return 'graduate_program'
        elif 'trainee' in text or 'traineeship' in text:
            return 'training_program'
        elif 'yes4youth' in text or 'yes 4 youth' in text or 'y4y' in text:
            return 'internship'  # Yes4Youth is a specific internship program
        elif 'vacancy' in text or 'vacancies' in text or 'job' in text:
            return 'job'
        else:
            return 'opportunity'

    def _extract_category_from_url(self, url):
        """
        Extract category name from URL for metadata tracking.
        """
        if not url:
            return 'general'
        
        url_lower = url.lower()
        if 'learnership' in url_lower:
            return 'learnerships'
        elif 'internship' in url_lower:
            return 'internships'
        elif 'bursary' in url_lower or 'bursaries' in url_lower:
            return 'bursaries'
        elif 'apprentice' in url_lower:
            return 'apprenticeships'
        elif 'graduate' in url_lower:
            return 'graduate_programs'
        elif 'grade-12' in url_lower:
            return 'grade_12'
        else:
            return 'general'

    def _extract_company(self, title, content):
        if not title:
            return 'Unknown'
        
        # Pattern: "Company: Programme Type Year"
        if ':' in title:
            company = title.split(':')[0].strip()
            if len(company) > 2 and len(company) < 50:
                return company
        
        # Look for company indicators in content
        patterns = [
            r'(?:company|employer|organization|organisation)[:\s]+([A-Z][A-Za-z\s&]+?)(?:\.|,|\n|is)',
            r'([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)\s+(?:is\s+)?(?:offering|inviting|looking)',
        ]
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return 'Unknown'

    def _extract_location(self, content):
        if not content:
            return None
        
        content_lower = content.lower()
        
        # Check for SA-wide
        if 'south africa' in content_lower or 'nationwide' in content_lower:
            return 'South Africa'
        
        # Check for provinces
        for province in self.SA_PROVINCES:
            if province in content_lower:
                return province.title()
        
        # Check for cities
        for city in self.SA_CITIES:
            if city in content_lower:
                return city.title()
        
        # Pattern-based extraction
        match = re.search(r'location[:\s]+([A-Za-z\s,]+?)(?:\n|\.|\||$)', content, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:50]
        
        return None

    def _extract_closing_date(self, content):
        """
        Returns dict {'raw': str, 'parsed': str (YYYY-MM-DD)}
        """
        result = {'raw': None, 'parsed': None}
        if not content:
            return result
        
        for pattern in self.CLOSING_DATE_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                groups = match.groups()
                result['raw'] = match.group(0)
                try:
                    day = int(groups[0])
                    month = self.MONTH_MAP.get(groups[1].lower(), int(groups[1]))
                    year = int(groups[2])
                    result['parsed'] = f"{year}-{month:02d}-{day:02d}"
                except (ValueError, IndexError):
                    pass
                break
        
        return result

    def _extract_application_url(self, response):
        """
        Extract external application URL from content.
        """
        # Look for "Apply Online" links (PuffAndPass pattern)
        apply_links = response.css('a[href*="apply"]::attr(href)').getall() + \
                     response.css('a:contains("Apply")::attr(href)').getall() + \
                     response.css('a:contains("apply")::attr(href)').getall()
        
        for link in apply_links:
            if link and 'puffandpass.co.za' not in link:
                if link.startswith('http'):
                    return link
        
        # Look for external links
        all_links = response.css('a::attr(href)').getall()
        external_patterns = [
            'careers.', 'jobs.', 'apply.', 'applications.',
            '/careers/', '/jobs/', '/apply/', '/vacancies/'
        ]
        
        for link in all_links:
            if link and 'puffandpass.co.za' not in link:
                if any(pattern in link.lower() for pattern in external_patterns):
                    if link.startswith('http'):
                        return link
        
        return None

    def _extract_eligibility(self, description):
        eligibility = {}
        
        # Age requirement
        age_match = re.search(r'(?:aged?|between)\s*(\d{1,2})\s*(?:to|-|and)\s*(\d{1,2})', description, re.IGNORECASE)
        if age_match:
            eligibility['min_age'] = int(age_match.group(1))
            eligibility['max_age'] = int(age_match.group(2))
        
        # Citizenship
        if 'south african' in description or 'sa citizen' in description:
            eligibility['citizenship'] = 'South African'
        
        # Employment status
        if 'unemployed' in description:
            eligibility['must_be_unemployed'] = True
        if 'must not be studying' in description or 'not studying full time' in description:
            eligibility['no_fulltime_study'] = True
        
        return eligibility

    def _extract_required_documents(self, description):
        docs = []
        doc_patterns = {
            'cv': r'\b(?:cv|curriculum vitae|resume)\b',
            'id': r'\b(?:id copy|id document|identity document|certified id)\b',
            'matric': r'\b(?:matric|matric certificate|grade 12|senior certificate)\b',
            'qualification': r'\b(?:qualification|certificate|diploma|degree)\b',
            'academic_record': r'\b(?:academic record|transcript|results)\b',
            'proof_of_residence': r'\b(?:proof of residence|por)\b',
            'motivation_letter': r'\b(?:motivation|cover letter|letter of motivation)\b',
        }
        
        for doc_name, pattern in doc_patterns.items():
            if re.search(pattern, description, re.IGNORECASE):
                docs.append(doc_name)
        
        return docs

    def _extract_contacts(self, content):
        """
        Extract email addresses and phone numbers.
        """
        contacts = {'emails': [], 'phones': []}
        
        # Emails
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content)
        contacts['emails'] = list(set(emails))[:5]
        
        # SA phone numbers
        phones = re.findall(r'\b(?:0[0-9]{9}|\+27[0-9]{9}|0[0-9]{2}[\s-]?[0-9]{3}[\s-]?[0-9]{4})\b', content)
        contacts['phones'] = list(set(phones))[:3]
        
        return contacts

    def _extract_salary(self, content):
        """
        Extract salary information if present.
        """
        patterns = [
            r'[rR][\s]?(\d{1,3}(?:[,\s]?\d{3})*)\s*(?:per|p\.?m|pm|monthly|/month)',
            r'stipend\s*(?:of)?\s*[rR][\s]?(\d{1,3}(?:[,\s]?\d{3})*)',
            r'salary\s*(?:of)?\s*[rR][\s]?(\d{1,3}(?:[,\s]?\d{3})*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return None

    def _detect_sector(self, text):
        sectors = {
            'engineering': ['engine', 'electrical', 'mechanical', 'civil', 'chemical', 'mining'],
            'it': ['software', 'developer', 'programmer', 'it ', 'information technology', 'data', 'cyber'],
            'finance': ['finance', 'accounting', 'audit', 'bank', 'investment', 'actuarial'],
            'healthcare': ['health', 'medical', 'nurse', 'doctor', 'pharmacy', 'clinical'],
            'government': ['government', 'public service', 'municipality', 'department of'],
            'retail': ['retail', 'store', 'shop', 'customer service', 'sales'],
            'hospitality': ['hotel', 'hospitality', 'tourism', 'restaurant', 'catering'],
            'manufacturing': ['manufacturing', 'factory', 'production', 'assembly'],
            'agriculture': ['agriculture', 'farm', 'agricultural'],
        }
        
        for sector, keywords in sectors.items():
            if any(keyword in text for keyword in keywords):
                return sector
        
        return 'general'

    def _extract_reference_number(self, text, title=''):
        """
        Extract reference/job number from content.
        """
        patterns = [
            r'(?:ref(?:erence)?[\s:\.#]*)?([A-Z]{2,5}[\d]{4,8}(?:-\d+)?)',
            r'(?:ref(?:erence)?|job\s*(?:no|number|id)?)[:\s\.#]+([A-Za-z0-9\-\/]+)',
            r'(?:vacancy|post|position)\s*(?:no|number|id)?[:\s\.#]+([A-Za-z0-9\-\/]+)',
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
        """
        patterns = [
            r'(\d+)\s*(?:positions?|posts?|vacancies|openings)',
            r'[xX](\d+)',
            r'(?:positions?|posts?|vacancies)\s*(?:available)?[:\s]*(\d+)',
            r'(?:we\s+(?:have|are\s+hiring)|hiring)\s+(\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text[:3000], re.IGNORECASE)
            if match:
                count = int(match.group(1))
                if 1 <= count <= 500:
                    return count
        return None

    def _extract_published_date(self, url):
        """
        Extract published date from URL or content.
        PuffAndPass doesn't use date in URL, so we'll try patterns.
        """
        # PuffAndPass doesn't have date in URL, return None
        return None

    def _extract_education_level(self, text):
        """
        Extract minimum education requirement.
        """
        text_lower = text.lower()
        
        levels = [
            ('phd', ['phd', 'doctorate', 'doctoral']),
            ('masters', ['master', 'msc', 'mba', 'mcom', 'med']),
            ('honours', ['honours', 'honors', 'btech']),
            ('degree', ['degree', 'bachelor', 'bsc', 'bcom', 'ba ']),
            ('diploma', ['diploma', 'national diploma', 'nd ']),
            ('certificate', ['certificate', 'nqf', 'short course']),
            ('grade_12', ['grade 12', 'matric', 'senior certificate', 'nsc', 'n3 ', 'n4 ', 'n5 ', 'n6 ']),
            ('grade_10', ['grade 10', 'abet level']),
        ]
        
        for level, keywords in levels:
            if any(k in text_lower for k in keywords):
                return level
        return None

    def _extract_experience_years(self, text):
        """
        Extract experience requirement in years.
        """
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
        Detect how to apply: email, online, in-person, post
        """
        text_lower = text.lower()
        methods = []
        
        if 'email' in text_lower or '@' in text:
            methods.append('email')
        if has_url or 'online' in text_lower or 'portal' in text_lower or 'website' in text_lower:
            methods.append('online')
        if 'hand deliver' in text_lower or 'in person' in text_lower or 'walk-in' in text_lower:
            methods.append('in_person')
        if 'post' in text_lower or 'courier' in text_lower or 'p.o. box' in text_lower:
            methods.append('post')
        
        return methods if methods else None

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
                break  # One keyword is enough
        
        # 4. Check post age (if no deadline and old post)
        if not closing_date_parsed:
            # Look for published date in meta or URL
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

