#!/usr/bin/env python3
"""
Create test jobs with Sprint 2 fields for testing.
"""
import sys
sys.path.insert(0, '/app')

import asyncio
import json
from app.core.database import async_session_maker
from app.models.opportunity import Job  # Job is alias for Opportunity
from app.models.user import User

async def create_test_jobs():
    async with async_session_maker() as db:
        # Find employer user (or use first user)
        from sqlalchemy import select
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("No users found. Please create a user first.")
            return
        
        # Test jobs with various skills and levels
        test_jobs = [
            {
                "title": "Senior Python Developer",
                "description": "We're looking for an experienced Python developer to join our team.",
                "company_name": "Tech Corp",
                "location": "Remote",
                "job_type": "full-time",
                "required_skills": json.dumps(["Python", "Django", "PostgreSQL", "Docker", "AWS"]),
                "experience_level": "senior",
                "industry": "Technology",
                "salary_range": "$100k-$150k"
            },
            {
                "title": "Junior Frontend Developer",
                "description": "Join our frontend team and work with React and TypeScript.",
                "company_name": "StartupXYZ",
                "location": "New York, NY",
                "job_type": "full-time",
                "required_skills": json.dumps(["JavaScript", "React", "TypeScript", "CSS", "HTML"]),
                "experience_level": "entry",
                "industry": "Technology",
                "salary_range": "$60k-$80k"
            },
            {
                "title": "Full Stack Engineer",
                "description": "Work on both frontend and backend systems using modern technologies.",
                "company_name": "Digital Solutions",
                "location": "San Francisco, CA",
                "job_type": "full-time",
                "required_skills": json.dumps(["Python", "React", "Node.js", "MongoDB", "Docker"]),
                "experience_level": "mid",
                "industry": "Technology",
                "salary_range": "$90k-$130k"
            },
            {
                "title": "DevOps Engineer",
                "description": "Manage our cloud infrastructure and CI/CD pipelines.",
                "company_name": "Cloud Native Inc",
                "location": "Remote",
                "job_type": "full-time",
                "required_skills": json.dumps(["Kubernetes", "Docker", "AWS", "Terraform", "Python"]),
                "experience_level": "mid",
                "industry": "Technology",
                "salary_range": "$95k-$135k"
            },
            {
                "title": "Lead Software Architect",
                "description": "Design and architect large-scale distributed systems.",
                "company_name": "Enterprise Tech",
                "location": "Austin, TX",
                "job_type": "full-time",
                "required_skills": json.dumps(["System Design", "Microservices", "AWS", "Java", "Python"]),
                "experience_level": "lead",
                "industry": "Technology",
                "salary_range": "$150k-$200k"
            }
        ]
        
        for job_data in test_jobs:
            job = Job(**job_data, employer_id=user.id)
            db.add(job)
        
        await db.commit()
        print(f"✅ Created {len(test_jobs)} test jobs with skills and experience levels")

if __name__ == "__main__":
    asyncio.run(create_test_jobs())
