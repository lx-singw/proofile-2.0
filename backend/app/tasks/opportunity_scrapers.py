"""
Opportunity Scrapers Tasks

Background Celery tasks for scraping opportunities with category/type classification.
Covers: CareerJunction, RecentJobs, StudentRoom, YES4Youth.
"""
import asyncio
import logging
from typing import Dict, Any, List
from datetime import datetime
from celery import shared_task
from sqlalchemy.orm import Session

from app.core.database import SyncSessionLocal
from app.models.portal_job import PortalJob
from app.tasks.portal_scraper import run_async, save_jobs_to_db

logger = logging.getLogger(__name__)


@shared_task(name="scrape_careerjunction")
def scrape_careerjunction(
    category: str = None,
    location: str = None,
    keyword: str = None,
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape jobs from CareerJunction.
    
    Args:
        category: Job category (technology, finance, internships, graduate)
        location: Location filter
        keyword: Search keyword
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.careerjunction import CareerJunctionScraper
        
        scraper = CareerJunctionScraper()
        logger.info(f"Starting CareerJunction scrape: category={category}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            category=category,
            location=location,
            keyword=keyword,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "careerjunction")
            return {
                "source": "careerjunction",
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "careerjunction", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "careerjunction", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping CareerJunction: {e}")
        return {"source": "careerjunction", "error": str(e), "saved": 0}
    finally:
        db.close()


@shared_task(name="scrape_recentjobs")
def scrape_recentjobs(
    category: str = None,
    keyword: str = None,
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape jobs from RecentJobs.
    
    Args:
        category: Job category
        keyword: Search keyword
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.recentjobs import RecentJobsScraper
        
        scraper = RecentJobsScraper()
        logger.info(f"Starting RecentJobs scrape: category={category}, keyword={keyword}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            category=category,
            keyword=keyword,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "recentjobs")
            return {
                "source": "recentjobs",
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "recentjobs", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "recentjobs", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping RecentJobs: {e}")
        return {"source": "recentjobs", "error": str(e), "saved": 0}
    finally:
        db.close()


@shared_task(name="scrape_studentroom")
def scrape_studentroom(
    category: str = "internships",
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape opportunities from StudentRoom.
    
    Args:
        category: Opportunity type (internships, learnerships, graduate)
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.studentroom import StudentRoomScraper
        
        scraper = StudentRoomScraper()
        logger.info(f"Starting StudentRoom scrape: category={category}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            category=category,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "studentroom")
            return {
                "source": "studentroom",
                "category": category,
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "studentroom", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "studentroom", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping StudentRoom: {e}")
        return {"source": "studentroom", "error": str(e), "saved": 0}
    finally:
        db.close()


@shared_task(name="scrape_yes4youth")
def scrape_yes4youth(
    location: str = None,
    pages: int = 3
) -> Dict[str, Any]:
    """
    Scrape learnerships from YES4Youth.
    
    Args:
        location: Province filter
        pages: Number of pages to scrape
        
    Returns:
        Dict with results
    """
    db = SyncSessionLocal()
    try:
        from app.scrapers.yes4youth import YES4YouthScraper
        
        scraper = YES4YouthScraper()
        logger.info(f"Starting YES4Youth scrape: location={location}, pages={pages}")
        
        jobs = run_async(scraper.scrape(
            location=location,
            pages=pages
        ))
        
        if jobs:
            saved = save_jobs_to_db(db, jobs, "yes4youth")
            return {
                "source": "yes4youth",
                "scraped": len(jobs),
                "saved": saved,
                "status": "success"
            }
        
        return {"source": "yes4youth", "scraped": 0, "saved": 0, "status": "no_results"}
        
    except ImportError as e:
        logger.error(f"Scraper import error: {e}")
        return {"source": "yes4youth", "error": "Scraper not available", "saved": 0}
    except Exception as e:
        logger.error(f"Error scraping YES4Youth: {e}")
        return {"source": "yes4youth", "error": str(e), "saved": 0}
    finally:
        db.close()


# ==================== Combined Tasks ====================

@shared_task(name="scrape_all_opportunities")
def scrape_all_opportunities(pages: int = 2) -> Dict[str, Any]:
    """
    Scrape all opportunity sources including training programs.
    
    Designed for Celery Beat scheduling to keep opportunities fresh.
    
    Returns:
        Dict with combined results from all sources
    """
    results = {}
    
    # Jobs category sources
    results["careerjunction_tech"] = scrape_careerjunction(category="technology", pages=pages)
    results["careerjunction_finance"] = scrape_careerjunction(category="finance", pages=pages)
    results["recentjobs"] = scrape_recentjobs(pages=pages)
    
    # Training & Skills sources
    results["careerjunction_internships"] = scrape_careerjunction(category="internships", pages=pages)
    results["studentroom_internships"] = scrape_studentroom(category="internships", pages=pages)
    results["studentroom_learnerships"] = scrape_studentroom(category="learnerships", pages=pages)
    results["yes4youth"] = scrape_yes4youth(pages=pages)
    
    # Calculate totals
    total_scraped = sum(r.get("scraped", 0) for r in results.values())
    total_saved = sum(r.get("saved", 0) for r in results.values())
    
    # Count by category
    jobs_saved = sum(
        r.get("saved", 0) for k, r in results.items() 
        if k in ["careerjunction_tech", "careerjunction_finance", "recentjobs"]
    )
    training_saved = sum(
        r.get("saved", 0) for k, r in results.items()
        if k in ["careerjunction_internships", "studentroom_internships", 
                 "studentroom_learnerships", "yes4youth"]
    )
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "sources": results,
        "total_scraped": total_scraped,
        "total_saved": total_saved,
        "jobs_saved": jobs_saved,
        "training_programs_saved": training_saved
    }


@shared_task(name="scrape_training_programs")
def scrape_training_programs(pages: int = 3) -> Dict[str, Any]:
    """
    Scrape only training and skills program opportunities.
    
    Covers: Internships, Learnerships, Graduate Programmes
    
    Returns:
        Dict with results from training-focused sources
    """
    results = {}
    
    # StudentRoom - comprehensive training source
    results["studentroom_internships"] = scrape_studentroom(category="internships", pages=pages)
    results["studentroom_learnerships"] = scrape_studentroom(category="learnerships", pages=pages)
    results["studentroom_graduate"] = scrape_studentroom(category="graduate", pages=pages)
    
    # YES4Youth - learnerships
    results["yes4youth"] = scrape_yes4youth(pages=pages)
    
    # CareerJunction training section
    results["careerjunction_internships"] = scrape_careerjunction(category="internships", pages=pages)
    results["careerjunction_graduate"] = scrape_careerjunction(category="graduate", pages=pages)
    
    total_saved = sum(r.get("saved", 0) for r in results.values())
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "sources": results,
        "total_saved": total_saved,
        "opportunity_category": "training_skills_programs"
    }
