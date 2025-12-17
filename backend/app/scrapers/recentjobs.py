"""
RecentJobs Scraper

Scrapes job listings from recentjobs.co.za (SA job aggregator).
Focuses on employment opportunities.
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


class RecentJobsScraper(BaseScraper):
    """
    Scraper for recentjobs.co.za
    
    RecentJobs aggregates job listings from multiple SA sources.
    Good for finding latest employment opportunities.
    """
    
    source = "recentjobs"
    base_url = "https://recentjobs.co.za"
    opportunity_category = "jobs"
    opportunity_type = "employment"
    
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs from RecentJobs.
        
        Args:
            category: Job category filter
            location: Location filter
            keyword: Search keyword
            pages: Number of pages to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        all_jobs = []
        
        for page in range(1, min(pages + 1, ScraperConfig.MAX_PAGES)):
            try:
                url = self._build_search_url(category, location, keyword, page)
                self.logger.info(f"Scraping RecentJobs page {page}: {url}")
                
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
        
        self.logger.info(f"Scraped {len(all_jobs)} jobs from RecentJobs")
        return all_jobs
    
    def _build_search_url(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1
    ) -> str:
        """Build RecentJobs search URL"""
        if keyword:
            keyword_slug = keyword.lower().replace(" ", "+")
            url = f"{self.base_url}/?s={keyword_slug}"
        elif category:
            category_slug = category.lower().replace(" ", "-")
            url = f"{self.base_url}/category/{category_slug}/"
        else:
            url = f"{self.base_url}/jobs/"
        
        # Add pagination
        if page > 1:
            if "/category/" in url or "/jobs/" in url:
                url = url.rstrip("/") + f"/page/{page}/"
            else:
                url += f"&paged={page}"
        
        return url
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse job listings from RecentJobs search results"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # RecentJobs typically uses article or div for job cards
        job_cards = soup.select("article.job, .job-listing, .job-post, .entry")
        
        if not job_cards:
            # Fallback: try finding job links
            job_cards = soup.select("a[href*='/job/'], a[href*='jobs']")
        
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
        """Parse individual job card from RecentJobs"""
        job = {}
        
        # Title
        title_elem = card.select_one("h2 a, h3 a, .entry-title a, .job-title")
        if title_elem:
            job["title"] = clean_text(title_elem.get_text())
            href = title_elem.get("href", "")
            if href:
                job["url"] = href
                # Generate external ID from URL
                job["external_id"] = f"rj-{slugify(href.split('/')[-2] if '/' in href else href)[:50]}"
        
        # Company - often in meta or separate element
        company_elem = card.select_one(".company, .employer, [class*='company']")
        if company_elem:
            job["company"] = clean_text(company_elem.get_text())
        else:
            # Try to extract from content
            content = card.get_text()
            # Look for "at Company Name" pattern
            at_match = re.search(r'\bat\s+([A-Z][A-Za-z\s&]+)', content)
            if at_match:
                job["company"] = clean_text(at_match.group(1))
        
        # Location
        location_elem = card.select_one(".location, [class*='location']")
        if location_elem:
            job["location"] = clean_text(location_elem.get_text())
        
        # Date
        date_elem = card.select_one(".date, .posted-date, time, [class*='date']")
        if date_elem:
            job["posted_text"] = clean_text(date_elem.get_text())
        
        # Description/excerpt
        desc_elem = card.select_one(".excerpt, .summary, .entry-content p")
        if desc_elem:
            job["description"] = clean_text(desc_elem.get_text())
        
        return job if job.get("title") else None
