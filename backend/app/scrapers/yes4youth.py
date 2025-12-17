"""
YES4Youth Scraper

Scrapes learnership and job opportunities from yes4youth.co.za.
YES (Youth Employment Service) is a government-backed initiative
for youth employment and skills development in South Africa.
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


class YES4YouthScraper(BaseScraper):
    """
    Scraper for yes4youth.co.za
    
    YES4Youth is South Africa's Youth Employment Service, providing:
    - Learnerships
    - Work placements
    - Youth employment opportunities
    
    All opportunities are classified as 'learnership' type by default
    as they focus on skills development for youth.
    """
    
    source = "yes4youth"
    base_url = "https://www.yes4youth.co.za"
    opportunity_category = "training_skills_programs"
    opportunity_type = "learnership"
    
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape opportunities from YES4Youth.
        
        Args:
            category: Category filter (not typically used for YES)
            location: Province/location filter
            keyword: Search keyword
            pages: Number of pages to scrape
            
        Returns:
            List of normalized opportunity dictionaries
        """
        all_jobs = []
        
        for page in range(1, min(pages + 1, ScraperConfig.MAX_PAGES)):
            try:
                url = self._build_search_url(location, keyword, page)
                self.logger.info(f"Scraping YES4Youth page {page}: {url}")
                
                html = await fetch_page(url)
                if not html:
                    self.logger.warning(f"Failed to fetch page {page}")
                    continue
                
                jobs = self._parse_listing_page(html)
                if not jobs:
                    self.logger.info(f"No opportunities found on page {page}, stopping")
                    break
                
                # Normalize each job
                for job in jobs:
                    normalized = self.normalize_job(job)
                    # All YES opportunities are learnerships/training
                    normalized["opportunity_category"] = "training_skills_programs"
                    normalized["opportunity_type"] = "learnership"
                    all_jobs.append(normalized)
                
                # Rate limiting
                await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
                
            except Exception as e:
                self.logger.error(f"Error scraping page {page}: {e}")
                continue
        
        self.logger.info(f"Scraped {len(all_jobs)} opportunities from YES4Youth")
        return all_jobs
    
    def _build_search_url(
        self,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1
    ) -> str:
        """Build YES4Youth search URL"""
        # YES4Youth opportunities page
        url = f"{self.base_url}/opportunities"
        
        params = []
        if location:
            params.append(f"province={location.lower().replace(' ', '-')}")
        if keyword:
            params.append(f"search={keyword.lower().replace(' ', '+')}")
        if page > 1:
            params.append(f"page={page}")
        
        if params:
            url += "?" + "&".join(params)
        
        return url
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse opportunity listings from YES4Youth"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # YES4Youth uses card-based layouts
        job_cards = soup.select(
            ".opportunity-card, .job-card, .listing-card, "
            ".card, article.opportunity, .vacancy"
        )
        
        if not job_cards:
            # Fallback: try common listing patterns
            job_cards = soup.select("div[class*='listing'], div[class*='opportunity']")
        
        for card in job_cards:
            try:
                job = self._parse_job_card(card)
                if job and job.get("title"):
                    jobs.append(job)
            except Exception as e:
                self.logger.warning(f"Error parsing YES4Youth card: {e}")
                continue
        
        return jobs
    
    def _parse_job_card(self, card) -> Optional[Dict[str, Any]]:
        """Parse individual opportunity card from YES4Youth"""
        job = {}
        
        # Title
        title_elem = card.select_one("h2, h3, h4, .title, .card-title, a.title")
        if title_elem:
            job["title"] = clean_text(title_elem.get_text())
            # Get URL if it's a link
            if title_elem.name == 'a' or title_elem.find('a'):
                link = title_elem if title_elem.name == 'a' else title_elem.find('a')
                href = link.get("href", "")
                if href:
                    if not href.startswith("http"):
                        href = f"{self.base_url}{href}"
                    job["url"] = href
        
        # Generate external ID
        if job.get("url"):
            slug = job["url"].rstrip("/").split("/")[-1]
            job["external_id"] = f"yes-{slugify(slug)[:50]}"
        elif job.get("title"):
            job["external_id"] = f"yes-{slugify(job['title'])[:50]}"
        
        # Company/Host organization
        company_elem = card.select_one(
            ".company, .organization, .host, .employer, "
            "[class*='company'], [class*='employer']"
        )
        if company_elem:
            job["company"] = clean_text(company_elem.get_text())
        else:
            # YES opportunities often mention the company in description
            job["company"] = "YES4Youth Partner"
        
        # Location/Province
        location_elem = card.select_one(
            ".location, .province, [class*='location'], [class*='province']"
        )
        if location_elem:
            job["location"] = clean_text(location_elem.get_text())
        
        # Description
        desc_elem = card.select_one(".description, .excerpt, .summary, .card-text, p")
        if desc_elem:
            job["description"] = clean_text(desc_elem.get_text()[:500])
        
        # Date/Deadline
        date_elem = card.select_one(
            ".date, .deadline, .closing-date, time, [class*='date']"
        )
        if date_elem:
            date_text = clean_text(date_elem.get_text())
            if "closing" in date_text.lower() or "deadline" in date_text.lower():
                job["expires_text"] = date_text
            else:
                job["posted_text"] = date_text
        
        # Requirements (common in YES listings)
        req_elem = card.select_one(".requirements, [class*='requirements']")
        if req_elem:
            job["education_requirement"] = clean_text(req_elem.get_text()[:200])
        
        return job if job.get("title") else None
    
    async def scrape_all_provinces(self, pages_per_province: int = 2) -> List[Dict[str, Any]]:
        """Scrape opportunities from all SA provinces"""
        provinces = [
            "gauteng", "western-cape", "kwazulu-natal",
            "eastern-cape", "free-state", "limpopo",
            "mpumalanga", "north-west", "northern-cape"
        ]
        
        all_jobs = []
        for province in provinces:
            self.logger.info(f"Scraping YES4Youth for {province}")
            jobs = await self.scrape(location=province, pages=pages_per_province)
            all_jobs.extend(jobs)
            await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
        
        # Remove duplicates based on external_id
        seen = set()
        unique_jobs = []
        for job in all_jobs:
            if job.get("external_id") not in seen:
                seen.add(job.get("external_id"))
                unique_jobs.append(job)
        
        return unique_jobs
