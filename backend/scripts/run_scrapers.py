#!/usr/bin/env python
"""
Run scrapers and save jobs to database.
Run with: python -m scripts.run_scrapers
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.core.database import SyncSessionLocal
from app.models.portal_job import PortalJob


def save_jobs_to_db(db, jobs, source):
    """Save scraped jobs to database"""
    saved = 0
    updated = 0
    
    for job_data in jobs:
        try:
            external_id = job_data.get("external_id")
            if not external_id:
                continue
            
            existing = db.query(PortalJob).filter(
                PortalJob.external_id == external_id,
            ).first()
            
            if existing:
                for key, value in job_data.items():
                    if hasattr(existing, key) and value is not None:
                        setattr(existing, key, value)
                existing.scraped_at = datetime.utcnow()
                updated += 1
            else:
                job = PortalJob(
                    source=source,
                    scraped_at=datetime.utcnow(),
                    **job_data
                )
                db.add(job)
                saved += 1
                
        except Exception as e:
            print(f"   Error saving job: {e}")
            continue
    
    db.commit()
    return saved, updated


async def run_scrapers():
    """Run all scrapers and save to database"""
    print("🚀 Running Job Scrapers")
    print("=" * 50)
    
    db = SyncSessionLocal()
    total_saved = 0
    total_updated = 0
    
    try:
        # Careers24
        print("\n📥 Scraping Careers24...")
        from app.scrapers.careers24 import Careers24Scraper
        
        scraper = Careers24Scraper()
        jobs = await scraper.scrape(category="technology", pages=2)
        
        if jobs:
            saved, updated = save_jobs_to_db(db, jobs, "careers24")
            print(f"   ✅ Careers24: {saved} new, {updated} updated")
            total_saved += saved
            total_updated += updated
        
        await asyncio.sleep(2)
        
        # PNet
        print("\n📥 Scraping PNet...")
        from app.scrapers.pnet import PNetScraper
        
        scraper = PNetScraper()
        jobs = await scraper.scrape(keyword="developer", pages=2)
        
        if jobs:
            saved, updated = save_jobs_to_db(db, jobs, "pnet")
            print(f"   ✅ PNet: {saved} new, {updated} updated")
            total_saved += saved
            total_updated += updated
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Summary")
        print(f"   New jobs saved: {total_saved}")
        print(f"   Jobs updated: {total_updated}")
        
        # Total in database
        total = db.query(PortalJob).filter(PortalJob.is_active == True).count()
        print(f"   Total active jobs in portal: {total}")
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(run_scrapers())
