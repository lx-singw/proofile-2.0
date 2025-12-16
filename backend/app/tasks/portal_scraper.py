"""
Portal Job Scraper Tasks

Background Celery tasks for scraping jobs from South African job boards.
Uses async scrapers with proper rate limiting and error handling.
"""
import asyncio
import logging
from typing import Dict, Any, List
from datetime import datetime
from celery import shared_task
from sqlalchemy.orm import Session

from app.core.database import SyncSessionLocal
from app.models.portal_job import PortalJob

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in sync context (for Celery)"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


def save_jobs_to_db(db: Session, jobs: List[Dict[str, Any]], source: str) -> int:
    """
    Save scraped jobs to database, handling duplicates.
    
    Args:
        db: Database session
        jobs: List of job dictionaries
        source: Source identifier
        
    Returns:
        Number of new jobs saved
    """
    saved = 0
    updated = 0
    
    for job_data in jobs:
        try:
            external_id = job_data.get("external_id")
            if not external_id:
                continue
            
            # Check for existing by external_id
            existing = db.query(PortalJob).filter(
                PortalJob.external_id == external_id,
            ).first()
            
            if existing:
                # Update existing job
                for key, value in job_data.items():
                    if hasattr(existing, key) and value is not None:
                        setattr(existing, key, value)
                existing.scraped_at = datetime.utcnow()
                updated += 1
            else:
                # Create new job
                job = PortalJob(
                    source=source,
                    scraped_at=datetime.utcnow(),
                    **job_data
                )
                db.add(job)
                saved += 1
                
        except Exception as e:
            logger.error(f"Error saving job {job_data.get('external_id')}: {e}")
            continue
    
    db.commit()
    logger.info(f"Saved {saved} new jobs, updated {updated} existing from {source}")
    return saved


# ==================== Celery Tasks ====================

@shared_task(name="scrape_careers24")
def scrape_careers24(
    category: str = None,
    location: str = None,
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape jobs from Careers24.
    
    Args:
        category: Job category (technology, finance, etc.)
        location: Location filter
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.careers24 import Careers24Scraper
        
        scraper = Careers24Scraper()
        logger.info(f"Starting Careers24 scrape: category={category}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            category=category,
            location=location,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "careers24")
            return {
                "source": "careers24",
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "careers24", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "careers24", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping Careers24: {e}")
        return {"source": "careers24", "error": str(e), "saved": 0}
    finally:
        db.close()


@shared_task(name="scrape_pnet")
def scrape_pnet(
    category: str = None,
    location: str = None,
    keyword: str = None,
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape jobs from PNet.
    
    Args:
        category: Job category (technology, finance, etc.)
        location: Location filter
        keyword: Search keyword
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.pnet import PNetScraper
        
        scraper = PNetScraper()
        logger.info(f"Starting PNet scrape: category={category}, keyword={keyword}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            category=category,
            location=location,
            keyword=keyword,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "pnet")
            return {
                "source": "pnet",
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "pnet", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "pnet", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping PNet: {e}")
        return {"source": "pnet", "error": str(e), "saved": 0}
    finally:
        db.close()


@shared_task(name="scrape_indeed")
def scrape_indeed(
    keyword: str = None,
    location: str = None,
    job_type: str = None,
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape jobs from Indeed SA.
    
    Args:
        keyword: Search keyword
        location: Location filter
        job_type: Job type (full-time, contract, etc.)
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.indeed import IndeedScraper
        
        scraper = IndeedScraper()
        logger.info(f"Starting Indeed scrape: keyword={keyword}, location={location}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            keyword=keyword,
            location=location,
            job_type=job_type,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "indeed")
            return {
                "source": "indeed",
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "indeed", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "indeed", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping Indeed: {e}")
        return {"source": "indeed", "error": str(e), "saved": 0}
    finally:
        db.close()


@shared_task(name="scrape_portal_jobs")
def scrape_portal_jobs(
    source: str = "all",
    category: str = None,
    keyword: str = None,
    pages: int = 2
) -> Dict[str, Any]:
    """
    Master task to scrape jobs from one or all sources.
    
    Args:
        source: Source to scrape (careers24, pnet, indeed, all)
        category: Job category filter
        keyword: Search keyword
        pages: Number of pages per source
        
    Returns:
        Dict with combined results
    """
    results = {}
    
    sources_to_scrape = ["careers24", "pnet", "indeed"] if source == "all" else [source]
    
    for src in sources_to_scrape:
        try:
            if src == "careers24":
                result = scrape_careers24(category=category, pages=pages)
            elif src == "pnet":
                result = scrape_pnet(category=category, keyword=keyword, pages=pages)
            elif src == "indeed":
                result = scrape_indeed(keyword=keyword or category, pages=pages)
            else:
                result = {"error": f"Unknown source: {src}"}
            
            results[src] = result
            
        except Exception as e:
            results[src] = {"error": str(e)}
    
    # Calculate totals
    total_scraped = sum(r.get("scraped", 0) for r in results.values() if isinstance(r, dict))
    total_saved = sum(r.get("saved", 0) for r in results.values() if isinstance(r, dict))
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "sources": results,
        "total_scraped": total_scraped,
        "total_saved": total_saved
    }


@shared_task(name="scrape_all_sources")
def scrape_all_sources(pages: int = 2) -> Dict[str, Any]:
    """
    Convenience task to scrape all sources with default settings.
    
    Designed to be scheduled with Celery Beat for periodic scraping.
    """
    # Scrape popular categories from each source
    results = {}
    
    # Careers24 - Tech jobs
    results["careers24_tech"] = scrape_careers24(category="technology", pages=pages)
    
    # Careers24 - Finance jobs
    results["careers24_finance"] = scrape_careers24(category="finance", pages=pages)
    
    # PNet - Software jobs
    results["pnet_software"] = scrape_pnet(keyword="software developer", pages=pages)
    
    # PNet - Data jobs
    results["pnet_data"] = scrape_pnet(keyword="data analyst", pages=pages)
    
    # Indeed - Various searches
    results["indeed_tech"] = scrape_indeed(keyword="software engineer", pages=pages)
    results["indeed_finance"] = scrape_indeed(keyword="financial analyst", pages=pages)
    
    # Calculate totals
    total = sum(r.get("saved", 0) for r in results.values())
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "results": results,
        "total_saved": total
    }


@shared_task(name="cleanup_expired_jobs")
def cleanup_expired_jobs() -> Dict[str, int]:
    """
    Deactivate expired job listings.
    
    Returns:
        Dict with count of deactivated jobs
    """
    db = SyncSessionLocal()
    try:
        expired = db.query(PortalJob).filter(
            PortalJob.is_active == True,
            PortalJob.expires_at < datetime.utcnow()
        ).update({"is_active": False})
        
        db.commit()
        logger.info(f"Deactivated {expired} expired jobs")
        
        return {"deactivated": expired}
        
    except Exception as e:
        logger.error(f"Error in cleanup_expired_jobs: {e}")
        return {"error": str(e), "deactivated": 0}
    finally:
        db.close()


@shared_task(name="update_job_stats")
def update_job_stats() -> Dict[str, Any]:
    """
    Update portal job statistics.
    
    Returns:
        Dict with current stats
    """
    db = SyncSessionLocal()
    try:
        stats = {
            "total_active": db.query(PortalJob).filter(PortalJob.is_active == True).count(),
            "verified": db.query(PortalJob).filter(
                PortalJob.is_active == True,
                PortalJob.is_verified == True
            ).count(),
            "remote": db.query(PortalJob).filter(
                PortalJob.is_active == True,
                PortalJob.location_type == "remote"
            ).count(),
            "by_source": {},
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Count by source
        from sqlalchemy import func
        source_counts = db.query(
            PortalJob.source,
            func.count(PortalJob.id)
        ).filter(PortalJob.is_active == True).group_by(PortalJob.source).all()
        
        stats["by_source"] = {src: count for src, count in source_counts}
        
        return stats
        
    except Exception as e:
        logger.error(f"Error in update_job_stats: {e}")
        return {"error": str(e)}
    finally:
        db.close()
