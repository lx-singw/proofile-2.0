"""
PNet Job Scraper

Scrapes job listings from pnet.co.za (South Africa's leading recruitment portal).
"""
import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.scrapers.utils import (
    ScraperConfig,
    fetch_page,
    parse_html,
    slugify,
    parse_salary,
    parse_relative_date,
    clean_text,
    extract_skills_from_text,
    extract_experience_level,
    extract_location_type
)

logger = logging.getLogger(__name__)


class PNetScraper:
    """
    Scraper for pnet.co.za
    
    PNet is one of South Africa's largest job portals.
    This scraper fetches job listings from their search results.
    """
    
    source = "pnet"
    base_url = "https://www.pnet.co.za"
    search_url = "https://www.pnet.co.za/jobs/"
    
    # Category mappings
    CATEGORY_SLUGS = {
        "technology": "it-and-computer",
        "finance": "accounting-finance",
        "engineering": "engineering-and-technical",
        "sales": "sales",
        "marketing": "marketing-and-pr",
        "healthcare": "medical-and-health",
        "education": "education-and-training",
        "legal": "legal",
        "hr": "hr-and-recruitment",
        "admin": "admin-office-and-support",
    }
    
    # Location mappings
    LOCATION_SLUGS = {
        "johannesburg": "gauteng-johannesburg",
        "cape town": "western-cape-cape-town",
        "durban": "kwazulu-natal-durban",
        "pretoria": "gauteng-pretoria",
        "sandton": "gauteng-sandton",
    }
    
    def __init__(self):
        self.jobs_found = []
    
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs from PNet.
        
        Args:
            category: Job category to filter by
            location: Location to filter by
            keyword: Search keyword
            pages: Number of pages to scrape
            
        Returns:
            List of parsed job dictings
        """
        self.jobs_found = []
        
        for page in range(1, min(pages + 1, ScraperConfig.MAX_PAGES + 1)):
            url = self._build_search_url(category, location, keyword, page)
            logger.info(f"Scraping PNet page {page}: {url}")
            
            html = await fetch_page(url)
            if not html:
                logger.warning(f"Failed to fetch page {page}")
                continue
            
            jobs = self._parse_listing_page(html)
            if not jobs:
                logger.info(f"No more jobs found on page {page}")
                break
            
            self.jobs_found.extend(jobs)
            
            # Rate limiting
            await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
        
        logger.info(f"Scraped {len(self.jobs_found)} jobs from PNet")
        return self.jobs_found
    
    def _build_search_url(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1
    ) -> str:
        """Build search URL with filters"""
        parts = [self.search_url]
        
        # Add keyword
        if keyword:
            keyword_slug = keyword.lower().replace(" ", "-")
            parts.append(f"kw-{keyword_slug}/")
        
        # Add category
        if category and category.lower() in self.CATEGORY_SLUGS:
            parts.append(f"sc-{self.CATEGORY_SLUGS[category.lower()]}/")
        
        # Add location
        if location:
            loc_lower = location.lower()
            if loc_lower in self.LOCATION_SLUGS:
                parts.append(f"loc-{self.LOCATION_SLUGS[loc_lower]}/")
            else:
                parts.append(f"loc-{loc_lower.replace(' ', '-')}/")
        
        url = "".join(parts)
        
        # Add pagination
        if page > 1:
            url += f"?page={page}"
        
        return url
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse job listings from search results page"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # PNet uses specific card structures
        job_cards = soup.select('.search-result, .job-result-card, [data-qa="job-card"]')
        
        if not job_cards:
            # Fallback selectors
            job_cards = soup.find_all('article') or soup.select('[class*="job"]')
        
        for card in job_cards[:ScraperConfig.JOBS_PER_PAGE]:
            try:
                job = self._parse_job_card(card)
                if job and job.get('title') and job.get('company'):
                    jobs.append(job)
            except Exception as e:
                logger.debug(f"Error parsing job card: {e}")
                continue
        
        return jobs
    
    def _parse_job_card(self, card) -> Optional[Dict[str, Any]]:
        """Parse individual job card"""
        job = {}
        
        # Title
        title_elem = card.select_one('h2 a, h3 a, .job-title a, [data-qa="job-title"]')
        if not title_elem:
            title_elem = card.select_one('h2, h3, .job-title')
        
        if title_elem:
            job['title'] = clean_text(title_elem.get_text())
            
            # Get job URL
            if title_elem.name == 'a' or title_elem.find('a'):
                link = title_elem if title_elem.name == 'a' else title_elem.find('a')
                href = link.get('href', '')
                job['source_url'] = href if href.startswith('http') else f"{self.base_url}{href}"
                
                # Extract external ID
                id_match = re.search(r'/job/(\d+)', href) or re.search(r'job-(\d+)', href)
                if id_match:
                    job['external_id'] = f"pnet-{id_match.group(1)}"
        
        if not job.get('title'):
            return None
        
        # Company
        company_elem = card.select_one('.company-name, .employer-name, [data-qa="company-name"]')
        if company_elem:
            job['company'] = clean_text(company_elem.get_text())
        else:
            job['company'] = "Confidential"
        
        # Location
        location_elem = card.select_one('.location, .job-location, [data-qa="location"]')
        if location_elem:
            location_text = clean_text(location_elem.get_text())
            # Remove common prefixes
            location_text = re.sub(r'^(Location:|Area:)\s*', '', location_text, flags=re.I)
            job['location'] = location_text
            
            # Extract city
            if ',' in location_text:
                job['city'] = location_text.split(',')[0].strip()
            else:
                job['city'] = location_text
        
        # Salary
        salary_elem = card.select_one('.salary, .remuneration, [data-qa="salary"]')
        if salary_elem:
            salary_text = clean_text(salary_elem.get_text())
            if salary_text and 'negotiable' not in salary_text.lower():
                salary_data = parse_salary(salary_text)
                job['salary_min'] = salary_data['min']
                job['salary_max'] = salary_data['max']
                job['salary_currency'] = salary_data['currency']
                job['salary_period'] = salary_data['period']
        
        # Date posted
        date_elem = card.select_one('.date-posted, .post-date, time, [data-qa="posted-date"]')
        if date_elem:
            date_text = clean_text(date_elem.get_text())
            job['posted_at'] = parse_relative_date(date_text)
        else:
            job['posted_at'] = datetime.utcnow()
        
        # Description snippet
        desc_elem = card.select_one('.job-snippet, .description, p')
        if desc_elem:
            job['description'] = clean_text(desc_elem.get_text())[:500]
        
        # Job type
        type_elem = card.select_one('.job-type, .employment-type, [data-qa="job-type"]')
        if type_elem:
            job['job_type'] = self._normalize_job_type(clean_text(type_elem.get_text()))
        
        # Extract additional info
        full_text = f"{job.get('title', '')} {job.get('description', '')}"
        job['skills'] = extract_skills_from_text(full_text)
        job['experience_level'] = extract_experience_level(full_text)
        job['location_type'] = extract_location_type(job.get('title', ''), job.get('description', ''))
        
        # Generate slug
        job['slug'] = slugify(f"{job['title']}-{job.get('company', 'unknown')}-{job.get('external_id', datetime.now().timestamp())}")
        
        # Metadata
        job['country'] = "South Africa"
        job['category'] = self._detect_category(full_text)
        if 'job_type' not in job:
            job['job_type'] = 'full-time'
        job['is_active'] = True
        
        return job
    
    def _normalize_job_type(self, text: str) -> str:
        """Normalize job type string"""
        text_lower = text.lower()
        if 'permanent' in text_lower or 'full' in text_lower:
            return 'full-time'
        elif 'contract' in text_lower:
            return 'contract'
        elif 'part' in text_lower:
            return 'part-time'
        elif 'temp' in text_lower:
            return 'temporary'
        return 'full-time'
    
    def _detect_category(self, text: str) -> str:
        """Detect job category from text"""
        text_lower = text.lower()
        
        if any(x in text_lower for x in ['software', 'developer', 'engineer', 'programmer', 'it ']):
            return 'technology'
        elif any(x in text_lower for x in ['accountant', 'finance', 'financial', 'banking']):
            return 'finance'
        elif any(x in text_lower for x in ['sales', 'business development']):
            return 'sales'
        elif any(x in text_lower for x in ['marketing', 'digital marketing']):
            return 'marketing'
        elif any(x in text_lower for x in ['admin', 'administrator', 'secretary']):
            return 'admin'
        elif any(x in text_lower for x in ['hr', 'human resource', 'recruitment']):
            return 'hr'
        
        return 'other'
    
    async def scrape_job_detail(self, url: str) -> Optional[Dict[str, Any]]:
        """Scrape full job details from a job page"""
        html = await fetch_page(url)
        if not html:
            return None
        
        soup = parse_html(html)
        if not soup:
            return None
        
        job = {}
        
        # Full description
        desc_elem = soup.select_one('.job-description, .description, [data-qa="job-description"]')
        if desc_elem:
            job['description'] = clean_text(desc_elem.get_text())
            job['description_html'] = str(desc_elem)
        
        # Extract skills from full description
        if job.get('description'):
            job['skills'] = extract_skills_from_text(job['description'])
        
        return job
