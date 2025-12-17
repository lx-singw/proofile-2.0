"""
Base Scraper Class

Abstract base class for opportunity scrapers with built-in
opportunity_category and opportunity_type classification.
"""
import logging
from abc import ABC, abstractmethod
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


class BaseScraper(ABC):
    """
    Abstract base class for opportunity scrapers.
    
    All scrapers should inherit from this class and implement:
    - scrape() method
    - _parse_listing_page() method
    - _parse_job_card() method
    
    The base class provides:
    - Opportunity category/type classification
    - Common utility methods
    - Standardized job normalization
    """
    
    # Override these in subclasses
    source: str = "unknown"
    base_url: str = ""
    opportunity_category: str = "jobs"  # 'jobs' or 'training_skills_programs'
    opportunity_type: str = "employment"  # 'employment', 'internship', 'learnership', etc.
    
    def __init__(self):
        self.config = ScraperConfig()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    async def scrape(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        keyword: Optional[str] = None,
        pages: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Scrape opportunities from the source.
        
        Args:
            category: Job category filter
            location: Location filter
            keyword: Search keyword
            pages: Number of pages to scrape
            
        Returns:
            List of normalized opportunity dictionaries
        """
        pass
    
    def normalize_job(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw scraped data to standard format.
        Adds opportunity_category and opportunity_type.
        
        Args:
            raw_data: Raw scraped job data
            
        Returns:
            Normalized job dictionary
        """
        # Extract salary
        salary_info = {}
        if raw_data.get("salary_text"):
            salary_info = parse_salary(raw_data["salary_text"])
        
        # Parse posted date
        posted_at = None
        if raw_data.get("posted_text"):
            posted_at = parse_relative_date(raw_data["posted_text"])
        elif raw_data.get("posted_at"):
            posted_at = raw_data["posted_at"]
        
        # Extract skills from description
        skills = raw_data.get("skills", [])
        if not skills and raw_data.get("description"):
            skills = extract_skills_from_text(raw_data["description"])
        
        # Determine experience level
        exp_level = raw_data.get("experience_level")
        if not exp_level:
            title = raw_data.get("title", "")
            desc = raw_data.get("description", "")
            exp_level = extract_experience_level(f"{title} {desc}")
        
        # Determine location type
        loc_type = raw_data.get("location_type")
        if not loc_type:
            title = raw_data.get("title", "")
            desc = raw_data.get("description", "")
            loc_type = extract_location_type(title, desc)
        
        # Generate slug
        slug = raw_data.get("slug")
        if not slug:
            title = raw_data.get("title", "")
            company = raw_data.get("company", "")
            slug = slugify(f"{title}-{company}")
        
        return {
            "external_id": raw_data.get("external_id") or raw_data.get("id"),
            "source": self.source,
            "source_url": raw_data.get("url") or raw_data.get("source_url"),
            "title": clean_text(raw_data.get("title")),
            "company": clean_text(raw_data.get("company")),
            "company_logo_url": raw_data.get("company_logo_url"),
            "location": clean_text(raw_data.get("location")),
            "location_type": loc_type,
            "country": raw_data.get("country", "South Africa"),
            "city": raw_data.get("city"),
            "salary_min": salary_info.get("min") or raw_data.get("salary_min"),
            "salary_max": salary_info.get("max") or raw_data.get("salary_max"),
            "salary_currency": salary_info.get("currency", "ZAR"),
            "salary_period": salary_info.get("period", "monthly"),
            "description": raw_data.get("description"),
            "description_html": raw_data.get("description_html"),
            "skills": skills[:10] if skills else None,
            "experience_level": exp_level,
            "education_requirement": raw_data.get("education_requirement"),
            "years_experience_min": raw_data.get("years_experience_min"),
            "years_experience_max": raw_data.get("years_experience_max"),
            "category": raw_data.get("category"),
            "job_type": raw_data.get("job_type"),
            "opportunity_category": self.opportunity_category,
            "opportunity_type": self.opportunity_type,
            "posted_at": posted_at,
            "expires_at": raw_data.get("expires_at"),
            "slug": slug,
            "is_active": True,
        }
    
    def detect_opportunity_type(self, text: str) -> str:
        """
        Detect opportunity type from job text.
        
        Args:
            text: Job title or description
            
        Returns:
            Detected opportunity type
        """
        text_lower = text.lower()
        
        # Training & Skills Programs
        if any(x in text_lower for x in ["internship", "intern "]):
            return "internship"
        if any(x in text_lower for x in ["learnership", "learner "]):
            return "learnership"  
        if any(x in text_lower for x in ["apprenticeship", "apprentice "]):
            return "apprenticeship"
        
        # Jobs category
        if any(x in text_lower for x in ["volunteer", "volunteering"]):
            return "volunteer"
        if any(x in text_lower for x in ["board member", "board director", "ned", "non-executive"]):
            return "board"
        if any(x in text_lower for x in ["consultant", "consulting"]):
            return "consulting"
        if any(x in text_lower for x in ["freelance", "freelancer"]):
            return "freelance"
        if any(x in text_lower for x in ["contract", "contractor", "fixed term"]):
            return "contract"
        
        return "employment"  # Default
    
    def detect_opportunity_category(self, opportunity_type: str) -> str:
        """
        Get category based on opportunity type.
        
        Args:
            opportunity_type: The detected opportunity type
            
        Returns:
            Category: 'jobs' or 'training_skills_programs'
        """
        training_types = ["internship", "learnership", "apprenticeship"]
        if opportunity_type in training_types:
            return "training_skills_programs"
        return "jobs"
