"""
Indeed South Africa Job Scraper

Scrapes job listings from za.indeed.com.
"""
import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from urllib.parse import urlencode, quote

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


class IndeedScraper:
    """
    Scraper for za.indeed.com
    
    Indeed is a global job search engine with a South African portal.
    This scraper fetches job listings from their search results.
    """
    
    source = "indeed"
    base_url = "https://za.indeed.com"
    search_url = "https://za.indeed.com/jobs"
    
    def __init__(self):
        self.jobs_found = []
    
    async def scrape(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs from Indeed SA.
        
        Args:
            keyword: Search keyword (job title, skills, company)
            location: Location to filter by
            job_type: Job type filter (fulltime, parttime, contract)
            pages: Number of pages to scrape
            
        Returns:
            List of parsed job dictings
        """
        self.jobs_found = []
        
        for page in range(pages):
            url = self._build_search_url(keyword, location, job_type, page)
            logger.info(f"Scraping Indeed page {page + 1}: {url}")
            
            html = await fetch_page(url)
            if not html:
                logger.warning(f"Failed to fetch page {page + 1}")
                continue
            
            jobs = self._parse_listing_page(html)
            if not jobs:
                logger.info(f"No more jobs found on page {page + 1}")
                break
            
            self.jobs_found.extend(jobs)
            
            # Rate limiting
            await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
        
        logger.info(f"Scraped {len(self.jobs_found)} jobs from Indeed")
        return self.jobs_found
    
    def _build_search_url(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        page: int = 0
    ) -> str:
        """Build search URL with filters"""
        params = {}
        
        if keyword:
            params['q'] = keyword
        
        if location:
            params['l'] = location
        else:
            params['l'] = "South Africa"  # Default to SA
        
        if job_type:
            type_map = {
                'full-time': 'fulltime',
                'part-time': 'parttime',
                'contract': 'contract',
                'temporary': 'temporary',
                'internship': 'internship',
            }
            params['jt'] = type_map.get(job_type.lower(), job_type)
        
        # Pagination (Indeed uses 'start' parameter, 10 jobs per page)
        if page > 0:
            params['start'] = page * 10
        
        return f"{self.search_url}?{urlencode(params)}"
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse job listings from search results page"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # Indeed uses specific structures
        job_cards = soup.select('.job_seen_beacon, .jobsearch-ResultsList > li, [data-jk]')
        
        if not job_cards:
            # Fallback
            job_cards = soup.select('.result, .jobCard, article')
        
        for card in job_cards[:15]:  # Indeed shows about 15 per page
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
        
        # Job key (Indeed's unique ID)
        jk = card.get('data-jk')
        if jk:
            job['external_id'] = f"indeed-{jk}"
        
        # Title
        title_elem = card.select_one('h2.jobTitle a, .jobTitle a, [data-jk] a, h2 a')
        if not title_elem:
            title_elem = card.select_one('h2, .jobTitle')
        
        if title_elem:
            # Clean up title (remove "new" badges etc)
            title_text = title_elem.get_text()
            title_text = re.sub(r'\b(new|urgent)\b', '', title_text, flags=re.I)
            job['title'] = clean_text(title_text)
            
            # Get job URL
            if title_elem.name == 'a' or title_elem.find('a'):
                link = title_elem if title_elem.name == 'a' else title_elem.find('a')
                href = link.get('href', '')
                if href and not href.startswith('http'):
                    href = f"{self.base_url}{href}"
                job['source_url'] = href
        
        if not job.get('title'):
            return None
        
        # Company
        company_elem = card.select_one('.companyName, .company, [data-testid="company-name"], span.css-92r8pb')
        if company_elem:
            job['company'] = clean_text(company_elem.get_text())
        else:
            job['company'] = "Confidential"
        
        # Location
        location_elem = card.select_one('.companyLocation, .location, [data-testid="text-location"]')
        if location_elem:
            location_text = clean_text(location_elem.get_text())
            # Clean up location
            location_text = re.sub(r'(Remote|Hybrid).*$', '', location_text, flags=re.I).strip()
            job['location'] = location_text if location_text else "South Africa"
            
            if ',' in location_text:
                job['city'] = location_text.split(',')[0].strip()
            else:
                job['city'] = location_text
        
        # Check for remote/hybrid tags
        remote_elem = card.select_one('.remote, [data-testid="remote-tag"]')
        if remote_elem:
            remote_text = clean_text(remote_elem.get_text()).lower()
            if 'remote' in remote_text:
                job['location_type'] = 'remote'
            elif 'hybrid' in remote_text:
                job['location_type'] = 'hybrid'
        
        # Salary
        salary_elem = card.select_one('.salary-snippet, .salaryText, [data-testid="attribute_snippet"]')
        if salary_elem:
            salary_text = clean_text(salary_elem.get_text())
            if 'r' in salary_text.lower() or '$' in salary_text or '€' in salary_text:
                salary_data = parse_salary(salary_text)
                job['salary_min'] = salary_data['min']
                job['salary_max'] = salary_data['max']
                job['salary_currency'] = salary_data['currency']
                job['salary_period'] = salary_data['period']
        
        # Date posted
        date_elem = card.select_one('.date, .posted, [data-testid="myJobsStateDate"]')
        if date_elem:
            date_text = clean_text(date_elem.get_text())
            job['posted_at'] = parse_relative_date(date_text)
        else:
            job['posted_at'] = datetime.utcnow()
        
        # Description snippet
        desc_elem = card.select_one('.job-snippet, .summary, [data-testid="job-snippet"]')
        if desc_elem:
            # Clean up bullets
            for li in desc_elem.find_all('li'):
                li.insert_before(' • ')
            job['description'] = clean_text(desc_elem.get_text())[:500]
        
        # Job type from metadata
        metadata = card.select('.metadata span, [data-testid*="attribute"]')
        for meta in metadata:
            meta_text = clean_text(meta.get_text()).lower()
            if any(x in meta_text for x in ['full-time', 'full time', 'permanent']):
                job['job_type'] = 'full-time'
            elif any(x in meta_text for x in ['part-time', 'part time']):
                job['job_type'] = 'part-time'
            elif 'contract' in meta_text:
                job['job_type'] = 'contract'
        
        # Extract additional info
        full_text = f"{job.get('title', '')} {job.get('description', '')}"
        job['skills'] = extract_skills_from_text(full_text)
        job['experience_level'] = extract_experience_level(full_text)
        
        if 'location_type' not in job:
            job['location_type'] = extract_location_type(job.get('title', ''), job.get('description', ''))
        
        # Generate slug and ID
        if 'external_id' not in job:
            job['external_id'] = f"indeed-{datetime.now().timestamp()}"
        
        job['slug'] = slugify(f"{job['title']}-{job.get('company', 'unknown')}-{job['external_id']}")
        
        # Metadata
        job['country'] = "South Africa"
        job['category'] = self._detect_category(full_text)
        if 'job_type' not in job:
            job['job_type'] = 'full-time'
        job['is_active'] = True
        
        return job
    
    def _detect_category(self, text: str) -> str:
        """Detect job category from text"""
        text_lower = text.lower()
        
        if any(x in text_lower for x in ['software', 'developer', 'engineer', 'programmer']):
            return 'technology'
        elif any(x in text_lower for x in ['accountant', 'finance', 'financial']):
            return 'finance'
        elif any(x in text_lower for x in ['sales', 'business development']):
            return 'sales'
        elif any(x in text_lower for x in ['marketing', 'digital marketing']):
            return 'marketing'
        elif any(x in text_lower for x in ['healthcare', 'nurse', 'medical']):
            return 'healthcare'
        
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
        desc_elem = soup.select_one('#jobDescriptionText, .jobsearch-jobDescriptionText')
        if desc_elem:
            job['description'] = clean_text(desc_elem.get_text())
            job['description_html'] = str(desc_elem)
        
        # Extract skills from full description
        if job.get('description'):
            job['skills'] = extract_skills_from_text(job['description'])
        
        return job
