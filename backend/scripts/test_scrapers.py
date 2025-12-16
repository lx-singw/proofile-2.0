#!/usr/bin/env python
"""
Test script for job scrapers.
Run with: python -m scripts.test_scrapers
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def test_careers24():
    """Test Careers24 scraper"""
    print("\n=== Testing Careers24 Scraper ===")
    try:
        from app.scrapers.careers24 import Careers24Scraper
        
        scraper = Careers24Scraper()
        jobs = await scraper.scrape(category="technology", pages=1)
        
        print(f"✅ Scraped {len(jobs)} jobs from Careers24")
        
        if jobs:
            job = jobs[0]
            print(f"   Sample: {job.get('title')} at {job.get('company')}")
            print(f"   Location: {job.get('location')}")
            print(f"   Skills: {job.get('skills', [])[:3]}")
        
        return len(jobs)
        
    except Exception as e:
        print(f"❌ Careers24 error: {e}")
        return 0


async def test_pnet():
    """Test PNet scraper"""
    print("\n=== Testing PNet Scraper ===")
    try:
        from app.scrapers.pnet import PNetScraper
        
        scraper = PNetScraper()
        jobs = await scraper.scrape(keyword="developer", pages=1)
        
        print(f"✅ Scraped {len(jobs)} jobs from PNet")
        
        if jobs:
            job = jobs[0]
            print(f"   Sample: {job.get('title')} at {job.get('company')}")
            print(f"   Location: {job.get('location')}")
            
        return len(jobs)
        
    except Exception as e:
        print(f"❌ PNet error: {e}")
        return 0


async def test_indeed():
    """Test Indeed scraper"""
    print("\n=== Testing Indeed Scraper ===")
    try:
        from app.scrapers.indeed import IndeedScraper
        
        scraper = IndeedScraper()
        jobs = await scraper.scrape(keyword="software engineer", pages=1)
        
        print(f"✅ Scraped {len(jobs)} jobs from Indeed")
        
        if jobs:
            job = jobs[0]
            print(f"   Sample: {job.get('title')} at {job.get('company')}")
            print(f"   Location: {job.get('location')}")
            
        return len(jobs)
        
    except Exception as e:
        print(f"❌ Indeed error: {e}")
        return 0


async def main():
    """Run all scraper tests"""
    print("🧪 Starting Scraper Tests")
    print("=" * 50)
    
    results = {}
    
    # Test each scraper
    results["careers24"] = await test_careers24()
    await asyncio.sleep(1)  # Brief pause between sources
    
    results["pnet"] = await test_pnet()
    await asyncio.sleep(1)
    
    results["indeed"] = await test_indeed()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    total = sum(results.values())
    for source, count in results.items():
        status = "✅" if count > 0 else "⚠️"
        print(f"   {status} {source}: {count} jobs")
    
    print(f"\n   Total: {total} jobs scraped")
    
    if total > 0:
        print("\n✅ Scrapers are working!")
    else:
        print("\n⚠️ No jobs scraped - sites may be blocking or HTML structure changed")
    
    return total


if __name__ == "__main__":
    asyncio.run(main())
