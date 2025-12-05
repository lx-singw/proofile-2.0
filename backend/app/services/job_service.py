"""
Service layer for job-related operations.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from typing import TYPE_CHECKING
from app.models.job import Job
from app.schemas.job import JobCreate

if TYPE_CHECKING:
    from app.models.user import User


async def create_job(db: AsyncSession, job_in: JobCreate, employer_id: int) -> Job:
    """
    Create a new job posting.
    """
    new_job = Job(**job_in.model_dump(), employer_id=employer_id)
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job


async def get_jobs(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Job]:
    """
    Retrieve job postings with pagination.
    """
    result = await db.execute(select(Job).offset(skip).limit(limit).order_by(Job.created_at.desc()))
    return list(result.scalars().all())


async def get_recommended_jobs(db: AsyncSession, user: "User", limit: int = 5) -> list[Job]:
    """
    Get job recommendations sorted by relevance to the user.
    Relevance is calculated based on:
    - Industry match
    - Job title matching User.primary_goal
    - Job title/description matching Profile.headline
    """
    # 1. Fetch a pool of recent jobs (e.g., last 100)
    # in a real system this would use a vector DB or search engine
    result = await db.execute(select(Job).order_by(Job.created_at.desc()).limit(100))
    candidate_jobs = result.scalars().all()

    # 2. Extract user signals
    user_industry = (user.industry or "").lower()
    user_goal = (user.primary_goal or "").lower()
    user_headline = ""
    if user.profile and user.profile.headline:
        user_headline = user.profile.headline.lower()
    
    scored_jobs = []
    
    for job in candidate_jobs:
        score = 0
        job_title = job.title.lower()
        job_desc = job.description.lower()
        
        # Scoring Rules
        
        # A. Primary Goal in Title (High impact)
        # e.g. User wants "Product Manager", Job is "Senior Product Manager"
        if user_goal and user_goal in job_title:
            score += 50
            
        # B. Headline keywords in Title (Medium impact)
        if user_headline:
            # Simple token overlap
            headline_tokens = set(user_headline.split())
            title_tokens = set(job_title.split())
            overlap = headline_tokens.intersection(title_tokens)
            score += len(overlap) * 10
            
        # C. Industry match (if we had job industry, currently not in model)
        # For now, maybe check if job description mentions industry
        if user_industry and user_industry in job_desc:
            score += 20
            
        # D. Recency boost (simple decay could go here, but let's just use raw sort)
        
        scored_jobs.append((job, score))
        
    # 3. Sort by score descending
    scored_jobs.sort(key=lambda x: x[1], reverse=True)
    
    # 4. Return top N jobs
    return [job for job, score in scored_jobs[:limit]]