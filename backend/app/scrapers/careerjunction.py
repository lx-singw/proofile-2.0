"""
CareerJunction Job Scraper

Scrapes job listings from careerjunction.co.za (Major SA job board).
Supports jobs, internships, and graduate opportunities.
"""
import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.scrapers.base import BaseScraper
from app.scrapers.utils import (
    fetch_page,
    parse_html,
    slugify,
    clean_text,
    ScraperConfig
)

logger = logging.getLogger(__name__)


class CareerJunctionScraper(BaseScraper):
    """
    Scraper for careerjunction.co.za
    
    CareerJunction is one of South Africa's largest job boards,
    featuring employment, internships, and graduate programmes.
    """
    
    source = "careerjunction"
    base_url = "https://www.careerjunction.co.za"
    opportunity_category = "jobs"
    opportunity_type = "employment"
    
    # Category mappings
    CATEGORY_URLS = {
        "technology": "/jobs/it",
        "finance": "/jobs/finance",
        "engineering": "/jobs/engineering",
        "marketing": "/jobs/marketing",
        "sales": "/jobs/sales",
        "hr": "/jobs/hr-recruitment",
        "admin": "/jobs/admin-office",
        "healthcare": "/jobs/healthcare",
        "education": "/jobs/education",
        "internships": "/jobs/internships",
        "graduate": "/jobs/graduate-programmes",
    }
    
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs from CareerJunction.
        
        Args:
            category: Job category (technology, finance, internships, etc.)
            location: Location filter
            keyword: Search keyword
            pages: Number of pages to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        all_jobs = []
        
        # Detect if this is a training/skills category
        if category in ["internships", "graduate"]:
            self.opportunity_category = "training_skills_programs"
            self.opportunity_type = "internship"
        else:
            self.opportunity_category = "jobs"
            self.opportunity_type = "employment"
        
        for page in range(1, min(pages + 1, ScraperConfig.MAX_PAGES)):
            try:
                url = self._build_search_url(category, location, keyword, page)
                self.logger.info(f"Scraping CareerJunction page {page}: {url}")
                
                html = await fetch_page(url)
                if not html:
                    self.logger.warning(f"Failed to fetch page {page}")
                    continue
                
                jobs = self._parse_listing_page(html)
                if not jobs:
                    self.logger.info(f"No jobs found on page {page}, stopping")
                    break
                
                # Normalize each job
                for job in jobs:
                    normalized = self.normalize_job(job)
                    # Auto-detect opportunity type from title
                    detected_type = self.detect_opportunity_type(job.get("title", ""))
                    normalized["opportunity_type"] = detected_type
                    normalized["opportunity_category"] = self.detect_opportunity_category(detected_type)
                    all_jobs.append(normalized)
                
                # Rate limiting
                await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
                
            except Exception as e:
                self.logger.error(f"Error scraping page {page}: {e}")
                continue
        
        self.logger.info(f"Scraped {len(all_jobs)} jobs from CareerJunction")
        return all_jobs
    
    def _build_search_url(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1
    ) -> str:
        """Build CareerJunction search URL"""
        # Use category URL if available
        if category and category.lower() in self.CATEGORY_URLS:
            url = f"{self.base_url}{self.CATEGORY_URLS[category.lower()]}"
        elif keyword:
            keyword_slug = keyword.lower().replace(" ", "-")
            url = f"{self.base_url}/jobs/search?keywords={keyword_slug}"
        else:
            url = f"{self.base_url}/jobs"
        
        # Add pagination
        if page > 1:
            if "?" in url:
                url += f"&page={page}"
            else:
                url += f"?page={page}"
        
        # Add location
        if location:
            location_slug = location.lower().replace(" ", "-")
            if "?" in url:
                url += f"&location={location_slug}"
            else:
                url += f"?location={location_slug}"
        
        return url
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse job listings from CareerJunction search results"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # CareerJunction uses various wrapper classes for job cards
        # Try multiple selectors
        job_cards = soup.select(".job-listing, .job-card, .vacancy-card, article.job")
        
        if not job_cards:
            # Fallback: try finding any links that look like job listings
            job_cards = soup.select("a[href*='/jobs/'][href*='/view/']")
        
        for card in job_cards:
            try:
                job = self._parse_job_card(card)
                if job and job.get("title"):
                    jobs.append(job)
            except Exception as e:
                self.logger.warning(f"Error parsing job card: {e}")
                continue
        
        return jobs
    
    def _parse_job_card(self, card) -> Optional[Dict[str, Any]]:
        """Parse individual job card from CareerJunction"""
        job = {}
        
        # Title
        title_elem = card.select_one("h2, h3, .job-title, .title")
        if title_elem:
            job["title"] = clean_text(title_elem.get_text())
        
        # URL
        link_elem = card.select_one("a[href*='/jobs/']") or card if card.name == 'a' else None
        if link_elem:
            href = link_elem.get("href", "")
            if href and not href.startswith("http"):
                href = f"{self.base_url}{href}"
            job["url"] = href
            # Generate external ID from URL
            match = re.search(r'/view/(\d+)', href)
            if match:
                job["external_id"] = f"cj-{match.group(1)}"
            else:
                job["external_id"] = f"cj-{slugify(job.get('title', ''))[:50]}"
        
        # Company
        company_elem = card.select_one(".company, .employer, .company-name")
        if company_elem:
            job["company"] = clean_text(company_elem.get_text())
        
        # Location
        location_elem = card.select_one(".location, .job-location, [class*='location']")
        if location_elem:
            job["location"] = clean_text(location_elem.get_text())
        
        # Salary
        salary_elem = card.select_one(".salary, .remuneration, [class*='salary']")
        if salary_elem:
            job["salary_text"] = clean_text(salary_elem.get_text())
        
        # Date posted
        date_elem = card.select_one(".date, .posted, .time-posted, [class*='date']")
        if date_elem:
            job["posted_text"] = clean_text(date_elem.get_text())
        
        # Job type
        type_elem = card.select_one(".job-type, .employment-type, [class*='type']")
        if type_elem:
            type_text = clean_text(type_elem.get_text()).lower()
            if "permanent" in type_text or "full-time" in type_text:
                job["job_type"] = "full-time"
            elif "contract" in type_text:
                job["job_type"] = "contract"
            elif "part-time" in type_text:
                job["job_type"] = "part-time"
            elif "temporary" in type_text:
                job["job_type"] = "temporary"
        
        return job if job.get("title") else None
    
    async def scrape_internships(self, pages: int = 3) -> List[Dict[str, Any]]:
        """Convenience method to scrape internships specifically"""
        self.opportunity_category = "training_skills_programs"
        self.opportunity_type = "internship"
        return await self.scrape(category="internships", pages=pages)
    
    async def scrape_graduate_programmes(self, pages: int = 3) -> List[Dict[str, Any]]:
        """Convenience method to scrape graduate programmes"""
        self.opportunity_category = "training_skills_programs"
        self.opportunity_type = "internship"  # Graduate programmes are similar to internships
        return await self.scrape(category="graduate", pages=pages)
