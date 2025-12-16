"""
Careers24 Job Scraper

Scrapes job listings from careers24.com (South Africa's leading job board).
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


class Careers24Scraper:
    """
    Scraper for careers24.com
    
    Careers24 is one of South Africa's largest job boards.
    This scraper fetches job listings from their search results.
    """
    
    source = "careers24"
    base_url = "https://www.careers24.com"
    search_url = "https://www.careers24.com/jobs/"
    
    # Category mappings for filtering
    CATEGORY_URLS = {
        "technology": "it-and-telecommunications",
        "finance": "finance",
        "engineering": "engineering-and-manufacturing",
        "sales": "sales",
        "marketing": "marketing-and-communications",
        "healthcare": "medical-and-health",
        "education": "education-and-training",
        "consulting": "consulting",
        "retail": "retail-and-wholesale",
    }
    
    def __init__(self):
        self.jobs_found = []
    
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs from Careers24.
        
        Args:
            category: Job category to filter by
            location: Location to filter by
            pages: Number of pages to scrape
            
        Returns:
            List of parsed job dictings
        """
        self.jobs_found = []
        
        for page in range(1, min(pages + 1, ScraperConfig.MAX_PAGES + 1)):
            url = self._build_search_url(category, location, page)
            logger.info(f"Scraping Careers24 page {page}: {url}")
            
            html = await fetch_page(url)
            if not html:
                logger.warning(f"Failed to fetch page {page}")
                continue
            
            jobs = self._parse_listing_page(html)
            if not jobs:
                logger.info(f"No more jobs found on page {page}")
                break
            
            self.jobs_found.extend(jobs)
            
            # Rate limiting between pages
            await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
        
        logger.info(f"Scraped {len(self.jobs_found)} jobs from Careers24")
        return self.jobs_found
    
    def _build_search_url(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        page: int = 1
    ) -> str:
        """Build search URL with filters"""
        url = self.search_url
        
        # Add category
        if category and category.lower() in self.CATEGORY_URLS:
            url += f"c-{self.CATEGORY_URLS[category.lower()]}/"
        
        # Add location
        if location:
            location_slug = location.lower().replace(" ", "-").replace(",", "")
            url += f"l-{location_slug}/"
        
        # Add pagination
        if page > 1:
            url += f"p{page}/"
        
        return url
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse job listings from search results page"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # Find job cards - Careers24 uses various CSS classes
        # Try multiple selectors for robustness
        job_cards = soup.select('.job-card, .job-result, article.job, [data-job-id]')
        
        if not job_cards:
            # Fallback to finding by common patterns
            job_cards = soup.find_all('article') or soup.find_all('div', class_=re.compile(r'job'))
        
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
        title_elem = card.select_one('h2, h3, .job-title, [data-job-title]')
        if title_elem:
            job['title'] = clean_text(title_elem.get_text())
            
            # Get job URL
            link = title_elem.find('a') or card.find('a', href=re.compile(r'/job/'))
            if link and link.get('href'):
                href = link.get('href')
                job['source_url'] = href if href.startswith('http') else f"{self.base_url}{href}"
                
                # Extract external ID from URL
                id_match = re.search(r'/job/(\d+)', href)
                if id_match:
                    job['external_id'] = f"c24-{id_match.group(1)}"
        
        if not job.get('title'):
            return None
        
        # Company
        company_elem = card.select_one('.company-name, .employer, [data-company]')
        if company_elem:
            job['company'] = clean_text(company_elem.get_text())
        else:
            # Try to find company in card text
            text = card.get_text()
            job['company'] = "Unknown Company"
        
        # Location
        location_elem = card.select_one('.location, .job-location, [data-location]')
        if location_elem:
            location_text = clean_text(location_elem.get_text())
            job['location'] = location_text
            job['city'] = location_text.split(',')[0].strip() if ',' in location_text else location_text
        
        # Salary
        salary_elem = card.select_one('.salary, .remuneration, [data-salary]')
        if salary_elem:
            salary_text = clean_text(salary_elem.get_text())
            salary_data = parse_salary(salary_text)
            job['salary_min'] = salary_data['min']
            job['salary_max'] = salary_data['max']
            job['salary_currency'] = salary_data['currency']
            job['salary_period'] = salary_data['period']
        
        # Date posted
        date_elem = card.select_one('.date, .posted-date, time, [data-posted]')
        if date_elem:
            date_text = clean_text(date_elem.get_text())
            job['posted_at'] = parse_relative_date(date_text)
        else:
            job['posted_at'] = datetime.utcnow()
        
        # Description snippet
        desc_elem = card.select_one('.description, .snippet, .job-summary, p')
        if desc_elem:
            job['description'] = clean_text(desc_elem.get_text())[:500]
        
        # Extract additional info from description/title
        full_text = f"{job.get('title', '')} {job.get('description', '')}"
        job['skills'] = extract_skills_from_text(full_text)
        job['experience_level'] = extract_experience_level(full_text)
        job['location_type'] = extract_location_type(job.get('title', ''), job.get('description', ''))
        
        # Generate slug
        job['slug'] = slugify(f"{job['title']}-{job.get('company', 'unknown')}-{job.get('external_id', datetime.now().timestamp())}")
        
        # Metadata
        job['country'] = "South Africa"
        job['category'] = self._detect_category(full_text)
        job['job_type'] = self._detect_job_type(full_text)
        job['is_active'] = True
        
        return job
    
    def _detect_category(self, text: str) -> str:
        """Detect job category from text"""
        text_lower = text.lower()
        
        if any(x in text_lower for x in ['software', 'developer', 'engineer', 'python', 'javascript', 'it ']):
            return 'technology'
        elif any(x in text_lower for x in ['accountant', 'finance', 'financial', 'banking', 'audit']):
            return 'finance'
        elif any(x in text_lower for x in ['sales', 'business development', 'account manager']):
            return 'sales'
        elif any(x in text_lower for x in ['marketing', 'digital', 'social media', 'content']):
            return 'marketing'
        elif any(x in text_lower for x in ['healthcare', 'medical', 'nurse', 'doctor', 'pharmaceutical']):
            return 'healthcare'
        elif any(x in text_lower for x in ['consultant', 'consulting', 'advisory']):
            return 'consulting'
        
        return 'other'
    
    def _detect_job_type(self, text: str) -> str:
        """Detect job type from text"""
        text_lower = text.lower()
        
        if any(x in text_lower for x in ['contract', 'fixed term', 'fixed-term']):
            return 'contract'
        elif any(x in text_lower for x in ['part-time', 'part time']):
            return 'part-time'
        elif any(x in text_lower for x in ['intern', 'internship']):
            return 'internship'
        elif any(x in text_lower for x in ['freelance', 'freelancer']):
            return 'freelance'
        
        return 'full-time'
    
    async def scrape_job_detail(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape full job details from a job page.
        
        Args:
            url: Job detail page URL
            
        Returns:
            Dict with full job details
        """
        html = await fetch_page(url)
        if not html:
            return None
        
        soup = parse_html(html)
        if not soup:
            return None
        
        job = {}
        
        # Full description
        desc_elem = soup.select_one('.job-description, .description, article')
        if desc_elem:
            job['description'] = clean_text(desc_elem.get_text())
            job['description_html'] = str(desc_elem)
        
        # Requirements
        req_elem = soup.select_one('.requirements, .qualifications')
        if req_elem:
            job['requirements'] = clean_text(req_elem.get_text())
        
        return job
