"""
StudentRoom Scraper

Scrapes opportunity listings from studentroom.co.za.
Specializes in internships, learnerships, and graduate opportunities.
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


class StudentRoomScraper(BaseScraper):
    """
    Scraper for studentroom.co.za
    
    StudentRoom is a South African platform focused on:
    - Internships
    - Learnerships  
    - Graduate programmes
    - Bursaries
    - Student opportunities
    
    Perfect for the training_skills_programs category.
    """
    
    source = "studentroom"
    base_url = "https://www.studentroom.co.za"
    opportunity_category = "training_skills_programs"
    opportunity_type = "internship"
    
    # Category mappings
    CATEGORY_URLS = {
        "internships": "/internships/",
        "learnerships": "/learnerships/",
        "graduate": "/graduate-programmes/",
        "bursaries": "/bursaries/",
        "jobs": "/jobs/",
    }
    
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape opportunities from StudentRoom.
        
        Args:
            category: Opportunity category (internships, learnerships, graduate)
            location: Location filter
            keyword: Search keyword
            pages: Number of pages to scrape
            
        Returns:
            List of normalized opportunity dictionaries
        """
        all_jobs = []
        
        # Set opportunity type based on category
        category_lower = (category or "internships").lower()
        if category_lower == "learnerships":
            self.opportunity_type = "learnership"
            self.opportunity_category = "training_skills_programs"
        elif category_lower in ["internships", "graduate"]:
            self.opportunity_type = "internship"
            self.opportunity_category = "training_skills_programs"
        elif category_lower == "jobs":
            self.opportunity_type = "employment"
            self.opportunity_category = "jobs"
        else:
            self.opportunity_type = "internship"
            self.opportunity_category = "training_skills_programs"
        
        for page in range(1, min(pages + 1, ScraperConfig.MAX_PAGES)):
            try:
                url = self._build_search_url(category, location, keyword, page)
                self.logger.info(f"Scraping StudentRoom page {page}: {url}")
                
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
                    # Auto-detect opportunity type from title if not already set
                    detected_type = self.detect_opportunity_type(job.get("title", ""))
                    if detected_type != "employment":  # Prefer detected training types
                        normalized["opportunity_type"] = detected_type
                        normalized["opportunity_category"] = self.detect_opportunity_category(detected_type)
                    all_jobs.append(normalized)
                
                # Rate limiting
                await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
                
            except Exception as e:
                self.logger.error(f"Error scraping page {page}: {e}")
                continue
        
        self.logger.info(f"Scraped {len(all_jobs)} opportunities from StudentRoom")
        return all_jobs
    
    def _build_search_url(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1
    ) -> str:
        """Build StudentRoom search URL"""
        # Default to internships
        cat_lower = (category or "internships").lower()
        
        if cat_lower in self.CATEGORY_URLS:
            url = f"{self.base_url}{self.CATEGORY_URLS[cat_lower]}"
        elif keyword:
            keyword_slug = keyword.lower().replace(" ", "+")
            url = f"{self.base_url}/?s={keyword_slug}"
        else:
            url = f"{self.base_url}/internships/"
        
        # Add pagination
        if page > 1:
            if "?" in url:
                url += f"&page={page}"
            else:
                url = url.rstrip("/") + f"/page/{page}/"
        
        return url
    
    def _parse_listing_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse opportunity listings from StudentRoom"""
        soup = parse_html(html)
        if not soup:
            return []
        
        jobs = []
        
        # StudentRoom uses various classes for listings
        job_cards = soup.select(
            "article.post, .job-listing, .opportunity-card, "
            ".internship-card, .learnership-card, .entry"
        )
        
        if not job_cards:
            # Fallback: look for common listing patterns
            job_cards = soup.select("div.listing, .post-item, article")
        
        for card in job_cards:
            try:
                job = self._parse_job_card(card)
                if job and job.get("title"):
                    jobs.append(job)
            except Exception as e:
                self.logger.warning(f"Error parsing opportunity card: {e}")
                continue
        
        return jobs
    
    def _parse_job_card(self, card) -> Optional[Dict[str, Any]]:
        """Parse individual opportunity card from StudentRoom"""
        job = {}
        
        # Title
        title_elem = card.select_one("h2 a, h3 a, .entry-title a, .post-title a, a.title")
        if title_elem:
            job["title"] = clean_text(title_elem.get_text())
            href = title_elem.get("href", "")
            if href:
                if not href.startswith("http"):
                    href = f"{self.base_url}{href}"
                job["url"] = href
                # Generate external ID
                slug = href.rstrip("/").split("/")[-1]
                job["external_id"] = f"sr-{slugify(slug)[:50]}"
        
        if not job.get("title"):
            # Try alternate title location
            title_elem = card.select_one("h2, h3, .title")
            if title_elem:
                job["title"] = clean_text(title_elem.get_text())
        
        # Company/Organization
        company_elem = card.select_one(".company, .organization, .employer, [class*='company']")
        if company_elem:
            job["company"] = clean_text(company_elem.get_text())
        else:
            # Often included in the description
            desc = card.get_text()
            if "at " in desc.lower():
                at_match = re.search(r'at\s+([A-Z][A-Za-z\s&]+?)(?:\sin\s|\s-\s|\.|\,)', desc)
                if at_match:
                    job["company"] = clean_text(at_match.group(1))
        
        # Location
        location_elem = card.select_one(".location, [class*='location']")
        if location_elem:
            job["location"] = clean_text(location_elem.get_text())
        
        # Date
        date_elem = card.select_one(".date, .posted, time, [class*='date']")
        if date_elem:
            job["posted_text"] = clean_text(date_elem.get_text())
        
        # Description/excerpt
        desc_elem = card.select_one(".excerpt, .summary, .entry-content, .description")
        if desc_elem:
            job["description"] = clean_text(desc_elem.get_text()[:500])
        
        # Closing date (common for learnerships/internships)
        closing_elem = card.select_one(".closing-date, .deadline, [class*='closing']")
        if closing_elem:
            closing_text = clean_text(closing_elem.get_text())
            job["expires_text"] = closing_text
        
        return job if job.get("title") else None
    
    async def scrape_internships(self, pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape internships specifically"""
        return await self.scrape(category="internships", pages=pages)
    
    async def scrape_learnerships(self, pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape learnerships specifically"""
        return await self.scrape(category="learnerships", pages=pages)
    
    async def scrape_graduate_programmes(self, pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape graduate programmes specifically"""
        return await self.scrape(category="graduate", pages=pages)
