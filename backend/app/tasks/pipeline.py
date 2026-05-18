"""
Pipeline Orchestration Tasks

Runs the full opportunity processing pipeline after scraping:
normalize -> deduplicate -> score -> enrich salary -> extract skills
"""

import asyncio
import logging
from typing import Dict, Any
from datetime import datetime, timedelta

from celery import shared_task
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.opportunity import Opportunity
from app.services.opportunity_deduplicator import OpportunityDeduplicator
from app.services.opportunity_quality_scorer import OpportunityQualityScorer
from app.services.salary_enrichment import SalaryEnrichment
from app.services.skill_extractor import SkillExtractor

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=600)
def process_source_pipeline(self, source_name: str):
    """
    Run the full processing pipeline for opportunities from a specific source.
    
    Pipeline steps:
    1. Deduplicate opportunities
    2. Score quality (filter spam, low quality)
    3. Enrich missing salaries
    4. Extract skills from descriptions
    5. Activate feed-eligible opportunities
    
    Args:
        source_name: The source to process (pnet, careers24, indeed, etc.)
    
    Returns:
        {source, processed, duplicates_merged, feed_eligible, enriched, errors}
    """
    logger.info(f"Starting pipeline for source: {source_name}")
    
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(
            _run_pipeline(source_name)
        )
        
        logger.info(
            f"Pipeline for {source_name} completed: "
            f"{result['feed_eligible']} feed-eligible, "
            f"{result['duplicates_merged']} duplicates merged"
        )
        
        return result
        
    except Exception as exc:
        logger.error(f"Pipeline for {source_name} failed: {exc}")
        raise self.retry(exc=exc)


async def _run_pipeline(source_name: str) -> Dict[str, Any]:
    """Run the full pipeline asynchronously."""
    
    async with AsyncSessionLocal() as db:
        since = datetime.utcnow() - timedelta(days=7)
        
        # Fetch unprocessed opportunities from this source
        query = (
            select(Opportunity)
            .where(Opportunity.source == source_name)
            .where(Opportunity.created_at >= since)
            .where(Opportunity.is_duplicate_of.is_(None))
            .order_by(Opportunity.created_at.desc())
        )
        
        result = await db.execute(query)
        opportunities = result.scalars().all()
        
        if not opportunities:
            return {
                "source": source_name,
                "processed": 0,
                "duplicates_merged": 0,
                "feed_eligible": 0,
                "enriched": 0,
                "errors": 0,
            }
        
        stats = {
            "source": source_name,
            "processed": len(opportunities),
            "duplicates_merged": 0,
            "feed_eligible": 0,
            "enriched": 0,
            "errors": 0,
        }
        
        try:
            # Step 1: Deduplicate
            deduplicator = OpportunityDeduplicator(db)
            unique_opps = await deduplicator.deduplicate_batch(opportunities)
            stats["duplicates_merged"] = len(opportunities) - len(unique_opps)
            
            # Step 2: Quality score
            scorer = OpportunityQualityScorer(db)
            quality_stats = await scorer.score_opportunities_batch(unique_opps)
            stats["feed_eligible"] = quality_stats["feed_eligible"]
            
            # Step 3: Enrich salaries for feed-eligible opportunities
            feed_eligible = [o for o in unique_opps if o.is_active]
            if feed_eligible:
                enricher = SalaryEnrichment(db)
                enrich_stats = await enricher.enrich_batch(feed_eligible)
                stats["enriched"] = enrich_stats["enriched"]
            
            # Step 4: Extract skills for feed-eligible opportunities
            skill_extractor = SkillExtractor()
            for opp in feed_eligible:
                if opp.description:
                    try:
                        skills = skill_extractor.extract_skills(opp.description)
                        if skills:
                            opp.required_skills = ",".join(skills)
                    except Exception as e:
                        logger.warning(f"Skill extraction failed for opp {opp.id}: {e}")
                        stats["errors"] += 1
            
            # Commit all changes
            await db.commit()
            
        except Exception as e:
            logger.error(f"Pipeline processing error: {e}")
            stats["errors"] += 1
            await db.rollback()
            raise
        
        return stats


@shared_task
def cleanup_expired_opportunities():
    """
    Daily cleanup task to deactivate expired opportunities.
    Opportunities older than 30 days with no engagement are deactivated.
    """
    logger.info("Running expired opportunity cleanup")
    
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(_cleanup_expired())
        return result
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return {"error": str(e)}


async def _cleanup_expired() -> Dict[str, int]:
    """Deactivate expired opportunities."""
    
    async with AsyncSessionLocal() as db:
        cutoff = datetime.utcnow() - timedelta(days=30)
        
        # Find expired opportunities that are still active
        query = (
            select(Opportunity)
            .where(Opportunity.is_active == True)
            .where(Opportunity.posted_at < cutoff)
            .where(Opportunity.engagement_rate == 0.0)  # No engagement
        )
        
        result = await db.execute(query)
        expired = result.scalars().all()
        
        deactivated = 0
        for opp in expired:
            opp.is_active = False
            deactivated += 1
        
        await db.commit()
        
        logger.info(f"Deactivated {deactivated} expired opportunities")
        
        return {"deactivated": deactivated}


@shared_task
def run_full_pipeline():
    """
    Run the complete pipeline for all sources.
    Useful for manual trigger or one-off runs.
    """
    from app.tasks.scrapers import SCRAPER_REGISTRY
    
    logger.info("Running full pipeline for all sources")
    
    results = {}
    for source_name in SCRAPER_REGISTRY.keys():
        try:
            task = process_source_pipeline.delay(source_name)
            results[source_name] = {"task_id": task.id, "status": "queued"}
        except Exception as e:
            logger.error(f"Failed to queue pipeline for {source_name}: {e}")
            results[source_name] = {"error": str(e)}
    
    return results
