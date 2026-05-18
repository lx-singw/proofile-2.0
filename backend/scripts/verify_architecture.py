"""Verify SA-Search-Engine architecture migration"""
import sys

print("=" * 60)
print("Verifying SA-Search-Engine Architecture Migration")
print("=" * 60)

# Test 1: Backend scraper registry
print("\n1. Backend Scraper Registry:")
try:
    from app.tasks.scrapers import SCRAPER_REGISTRY
    print(f"   Registered scrapers: {list(SCRAPER_REGISTRY.keys())}")
    
    # Verify only backend-only scrapers are registered
    expected = {"yes4youth", "careerjunction"}
    actual = set(SCRAPER_REGISTRY.keys())
    
    if actual == expected:
        print("   ✅ PASS: Only backend-only scrapers registered")
    else:
        print(f"   ❌ FAIL: Expected {expected}, got {actual}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 2: Celery beat schedule
print("\n2. Celery Beat Schedule:")
try:
    from app.celery_app import beat_schedule
    scraper_tasks = [k for k in beat_schedule.keys() if "scrape" in k]
    print(f"   Scheduled scrapers: {scraper_tasks}")
    
    # Should NOT have puffandpass, recentjobs, studentroom, pnet, careers24, indeed
    scrapy_handled = {"scrape-puffandpass", "scrape-recentjobs", "scrape-studentroom", 
                      "scrape-pnet", "scrape-careers24", "scrape-indeed"}
    conflicts = scrapy_handled.intersection(set(scraper_tasks))
    
    if not conflicts:
        print("   ✅ PASS: No Scrapy-handled sources in Celery beat")
    else:
        print(f"   ❌ FAIL: Found Scrapy-handled sources: {conflicts}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 3: Ingest endpoint exists
print("\n3. Backend Ingest Endpoint:")
try:
    from app.api.v1.ingest import router
    routes = [r.path for r in router.routes]
    print(f"   Routes: {routes}")
    
    if "/opportunity" in routes or any("/opportunity" in str(r.path) for r in router.routes):
        print("   ✅ PASS: Ingest endpoint exists")
    else:
        print("   ⚠️ WARNING: /opportunity route not found in expected format")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 60)
print("Architecture Verification Complete")
print("=" * 60)
