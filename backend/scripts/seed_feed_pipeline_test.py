"""
Seed script for manual feed pipeline testing.

Creates a small set of opportunities with mixed quality so you can verify:
- quality filtering
- ranking
- category/type filters
- salary enrichment candidates

Run inside Docker:
  poetry run python scripts/seed_feed_pipeline_test.py
"""

import asyncio
from datetime import datetime, timedelta

from sqlalchemy import delete

from app.core.database import AsyncSessionLocal
from app.models.opportunity import Opportunity


SEED_OPPORTUNITIES = [
    {
        "title": "Senior Backend Engineer",
        "company_name": "Bash.com",
        "location": "Johannesburg, Gauteng",
        "city": "Johannesburg",
        "province": "Gauteng",
        "description": "We are looking for a Senior Backend Engineer with Python, FastAPI, PostgreSQL, Docker, AWS and Redis experience. 5+ years required.",
        "salary_min": 65000,
        "salary_max": 85000,
        "salary_visible": True,
        "source": "seed",
        "source_id": "seed-backend-1",
        "source_url": "https://example.com/jobs/backend-1",
        "application_url": "https://example.com/jobs/backend-1/apply",
        "posted_at": datetime.utcnow() - timedelta(days=2),
        "opportunity_type": "employment",
        "category": "jobs",
        "quality_score": 0.92,
        "is_active": True,
        "required_skills": "python,fastapi,postgresql,docker,aws,redis",
        "experience_level": "senior",
        "industry": "Technology",
    },
    {
        "title": "Software Engineering Internship",
        "company_name": "Takealot",
        "location": "Cape Town, Western Cape",
        "city": "Cape Town",
        "province": "Western Cape",
        "description": "Internship for graduates with JavaScript, React, Git and problem solving skills.",
        "salary_min": 18000,
        "salary_max": 22000,
        "salary_visible": True,
        "source": "seed",
        "source_id": "seed-internship-1",
        "source_url": "https://example.com/jobs/internship-1",
        "application_url": "https://example.com/jobs/internship-1/apply",
        "posted_at": datetime.utcnow() - timedelta(days=4),
        "opportunity_type": "internship",
        "category": "training_skills_programs",
        "quality_score": 0.88,
        "is_active": True,
        "required_skills": "javascript,react,git,problem_solving",
        "experience_level": "entry",
        "industry": "Technology",
    },
    {
        "title": "Accounting Bursary 2026",
        "company_name": "Old Mutual",
        "location": "Johannesburg, Gauteng",
        "city": "Johannesburg",
        "province": "Gauteng",
        "description": "Bursary opportunity for students studying accounting, finance, excel and communication.",
        "salary_visible": False,
        "source": "seed",
        "source_id": "seed-bursary-1",
        "source_url": "https://example.com/jobs/bursary-1",
        "application_url": "https://example.com/jobs/bursary-1/apply",
        "posted_at": datetime.utcnow() - timedelta(days=1),
        "opportunity_type": "bursary",
        "category": "bursaries",
        "quality_score": 0.74,
        "is_active": True,
        "required_skills": "excel,communication",
        "experience_level": "entry",
        "industry": "Finance",
    },
    {
        "title": "Work From Home Easy Money!!!",
        "company_name": "",
        "location": "Remote",
        "description": "No experience needed. Earn money fast now!",
        "salary_visible": False,
        "source": "seed",
        "source_id": "seed-spam-1",
        "posted_at": datetime.utcnow() - timedelta(days=1),
        "opportunity_type": "employment",
        "category": "jobs",
        "quality_score": 0.10,
        "is_active": False,
    },
]


async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(delete(Opportunity).where(Opportunity.source == "seed"))

        for payload in SEED_OPPORTUNITIES:
            db.add(Opportunity(**payload))

        await db.commit()
        print(f"Seeded {len(SEED_OPPORTUNITIES)} feed test opportunities")


if __name__ == "__main__":
    asyncio.run(main())
