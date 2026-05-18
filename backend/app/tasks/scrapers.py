"""
Celery Tasks for Opportunity Scrapers

Runs scrapers on a schedule and triggers the processing pipeline.
Each source runs independently so failures are isolated.
"""

import asyncio
import logging
from typing import Dict, Any, List

from celery import shared_task
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.services.opportunity_normalizer import OpportunityNormalizer
from app.services.opportunity_deduplicator import OpportunityDeduplicator
from app.services.opportunity_quality_scorer import OpportunityQualityScorer
from app.services.salary_enrichment import SalaryEnrichment
from app.services.skill_extractor import SkillExtractor
from app.scrapers.yes4youth import YES4YouthScraper
from app.scrapers.careerjunction import CareerJunctionScraper

logger = logging.getLogger(__name__)

# Source registry: name -> (scraper_class, default_pages, default_keyword)
# NOTE: Primary sources (puffandpass, recentjobs, studentroom, pnet, careers24, indeed, zabursaries)
# are handled by Scrapy spiders in scraping-engine, NOT backend scrapers.
# Only sources WITHOUT Scrapy spiders should be registered here as fallback.
SCRAPER_REGISTRY = {
    # Backend-only scrapers (no Scrapy equivalent)
    "yes4youth": (YES4YouthScraper, 3, None),
    "careerjunction": (CareerJunctionScraper, 3, None),
}


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def scrape_source(self, source_name: str, pages: int = 3, keyword: str = None):
    """
    Celery task to scrape opportunities from a single source.
    
    Args:
        source_name: Name of the scraper (pnet, careers24, indeed, etc.)
        pages: Number of pages to scrape
        keyword: Search keyword (optional)
    
    Returns:
        {source, scraped, saved, errors}
    """
    logger.info(f"Starting scraper task for {source_name}")

    if source_name not in SCRAPER_REGISTRY:
        raise ValueError(f"Unknown scraper source: {source_name}")

    scraper_class, default_pages, default_keyword = SCRAPER_REGISTRY[source_name]
    pages = pages or default_pages
    keyword = keyword or default_keyword

    try:
        # Run the async scraper in sync context
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(
            _run_scraper(scraper_class, pages, keyword)
        )
        
        logger.info(
            f"Scraper {source_name} completed: {result['saved']} saved, "
            f"{result['errors']} errors"
        )
        
        # Trigger pipeline processing after successful scrape
        from app.tasks.pipeline import process_source_pipeline
        process_source_pipeline.delay(source_name)
        
        return result

    except Exception as exc:
        logger.error(f"Scraper {source_name} failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc)


async def _run_scraper(scraper_class, pages: int, keyword: str) -> Dict[str, Any]:
    """Run a scraper and save results to the database."""
    scraper = scraper_class()
    normalizer = OpportunityNormalizer()
    
    scraped = 0
    saved = 0
    errors = 0
    
    try:
        # Scrape opportunities
        jobs = await scraper.scrape(pages=pages, keyword=keyword)
        scraped = len(jobs)
        
        if not jobs:
            return {"source": scraper.source, "scraped": 0, "saved": 0, "errors": 0}
        
        # Save to database
        async with AsyncSessionLocal() as db:
            from app.models.opportunity import Opportunity
            
            for job in jobs:
                try:
                    # Normalize the scraped data
                    normalized = normalizer.normalize(job)
                    
                    # Check if already exists (by source + source_id)
                    if normalized.get("source_id"):
                        existing = await db.execute(
                            select(Opportunity).where(
                                Opportunity.source_id == normalized["source_id"]
                            )
                        )
                        if existing.scalar_one_or_none():
                            continue  # Skip duplicate
                    
                    # Create opportunity
                    opportunity = Opportunity(
                        title=normalized["title"],
                        company_name=normalized["company_name"],
                        location=normalized["location"],
                        city=normalized.get("city"),
                        province=normalized.get("province"),
                        country=normalized.get("country", "South Africa"),
                        remote_type=normalized.get("remote_type"),
                        salary_min=normalized.get("salary_min"),
                        salary_max=normalized.get("salary_max"),
                        salary_visible=normalized.get("salary_visible", True),
                        description=normalized["description"],
                        source=normalized["source"],
                        source_id=normalized.get("source_id"),
                        source_url=normalized.get("source_url"),
                        application_url=normalized.get("application_url"),
                        posted_at=normalized.get("posted_at"),
                        expires_at=normalized.get("expires_at"),
                        experience_level=normalized.get("experience_level"),
                        industry=normalized.get("industry"),
                        category=normalized.get("opportunity_category", "jobs"),
                        opportunity_type=normalized.get("opportunity_type", "employment"),
                        quality_score=0.5,  # Will be scored by pipeline
                        is_active=False,  # Will be activated by pipeline
                    )
                    
                    db.add(opportunity)
                    saved += 1
                    
                except Exception as e:
                    logger.warning(f"Error saving job: {e}")
                    errors += 1
            
            await db.commit()
    
    except Exception as e:
        logger.error(f"Scraper failed: {e}")
        errors += 1
    
    return {
        "source": scraper.source,
        "scraped": scraped,
        "saved": saved,
        "errors": errors,
    }


@shared_task
def scrape_all_sources():
    """
    Trigger scraping for all configured sources.
    Runs each source as a separate task for isolation.
    """
    logger.info("Triggering scrapers for all sources")
    
    results = {}
    for source_name in SCRAPER_REGISTRY.keys():
        try:
            task = scrape_source.delay(source_name)
            results[source_name] = {"task_id": task.id, "status": "queued"}
        except Exception as e:
            logger.error(f"Failed to queue scraper {source_name}: {e}")
            results[source_name] = {"error": str(e)}
    
    return results
