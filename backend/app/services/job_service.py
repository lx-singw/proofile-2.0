"""
Service layer for job-related operations.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from typing import TYPE_CHECKING
from app.models.opportunity import Job  # Job is alias for Opportunity
from app.schemas.job import JobCreate

if TYPE_CHECKING:
    from app.models.user import User


async def create_job(db: AsyncSession, job_in: JobCreate, employer_id: int) -> Job:
    """
    Create a new job posting.
    """
    job_data = job_in.model_dump()
    if job_data.get("required_skills") is not None and isinstance(job_data["required_skills"], list):
        job_data["required_skills"] = json.dumps(job_data["required_skills"])

    new_job = Job(**job_data, employer_id=employer_id)
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job


async def get_jobs(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    verified_only: bool = False
) -> list[Job]:
    """
    Retrieve job postings with pagination.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        verified_only: If True, only return jobs that require verified candidates
    """
    query = select(Job)
    
    if verified_only:
        # Filter for jobs that require verification
        query = query.where(
            (Job.verified_candidates_only == True) | 
            (Job.requires_verification_level >= 2)
        )
    
    query = query.offset(skip).limit(limit).order_by(Job.created_at.desc())
    result = await db.execute(query)
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
    # Safe access for CachedUser objects that may not have profile loaded
    user_profile = getattr(user, 'profile', None)
    if user_profile and getattr(user_profile, 'headline', None):
        user_headline = user_profile.headline.lower()
    
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


async def get_recommended_jobs_advanced(
    db: AsyncSession, 
    user: "User", 
    limit: int = 10
) -> list[tuple[Job, int, dict]]:
    """
    Advanced job matching with detailed scoring breakdown.
    
    Returns: List of (job, total_score, score_breakdown) tuples
    """
    
    # Fetch candidate jobs
    result = await db.execute(select(Job).order_by(Job.created_at.desc()).limit(100))
    candidate_jobs = result.scalars().all()
    
    # Parse user skills
    user_skills_list = []
    if user.skills:
        try:
            user_skills_list = json.loads(user.skills) if isinstance(user.skills, str) else user.skills
        except:
            user_skills_list = []
    
    scored_jobs = []
    
    for job in candidate_jobs:
        breakdown = {
            "title_match": 0,
            "skills_match": 0,
            "experience_match": 0,
            "industry_match": 0,
            "verification_match": 0  # NEW: Verification boost
        }
        
        # Title matching (50 points max)
        if user.primary_goal:
            goal_lower = user.primary_goal.lower()
            title_lower = job.title.lower()
            if goal_lower in title_lower:
                breakdown["title_match"] = 50
            elif any(word in title_lower for word in goal_lower.split()):
                breakdown["title_match"] = 25
        
        # Skills matching (40 points max)
        if user_skills_list and job.required_skills:
            try:
                job_skills_list = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
                user_skills = set(s.lower() for s in user_skills_list)
                job_skills = set(s.lower() for s in job_skills_list)
                matching_skills = user_skills.intersection(job_skills)
                if job_skills:
                    match_pct = len(matching_skills) / len(job_skills)
                    breakdown["skills_match"] = int(match_pct * 40)
            except:
                pass
        
        # Experience level match (30 points max)
        if user.experience_level and job.experience_level:
            exp_map = {"entry": 1, "mid": 2, "senior": 3, "lead": 4}
            user_exp = exp_map.get(user.experience_level, 0)
            job_exp = exp_map.get(job.experience_level, 0)
            if user_exp == job_exp:
                breakdown["experience_match"] = 30
            elif abs(user_exp - job_exp) == 1:
                breakdown["experience_match"] = 15
        
        # Industry match (20 points)
        if user.industry and job.industry:
            if user.industry.lower() == job.industry.lower():
                breakdown["industry_match"] = 20
        
        # Verification boost (30 points max) - NEW
        # Verified users get a boost for jobs that prefer or require verification
        user_trust_score = getattr(user, 'trust_score', 0) or 0
        job_requires_verification = getattr(job, 'requires_verification_level', 0) or 0
        job_verified_only = getattr(job, 'verified_candidates_only', False)
        
        if job_requires_verification >= 2 or job_verified_only:
            # Job prefers verified candidates
            if user_trust_score >= 70:  # Gold level
                breakdown["verification_match"] = 30
            elif user_trust_score >= 50:  # Silver level
                breakdown["verification_match"] = 20
            elif user_trust_score >= 30:  # Bronze level
                breakdown["verification_match"] = 10
        
        # Experience level match (30 points max)
        if user.experience_level and job.experience_level:
            exp_map = {"entry": 1, "mid": 2, "senior": 3, "lead": 4}
            user_exp = exp_map.get(user.experience_level, 0)
            job_exp = exp_map.get(job.experience_level, 0)
            if user_exp == job_exp:
                breakdown["experience_match"] = 30
            elif abs(user_exp - job_exp) == 1:
                breakdown["experience_match"] = 15
        
        # Industry match (20 points)
        if user.industry and job.industry:
            if user.industry.lower() == job.industry.lower():
                breakdown["industry_match"] = 20
        
        total_score = sum(breakdown.values())
        scored_jobs.append((job, total_score, breakdown))
    
    # Sort by score descending
    scored_jobs.sort(key=lambda x: x[1], reverse=True)
    return scored_jobs[:limit]


async def get_job_by_id(db: AsyncSession, job_id: int) -> Job | None:
    """Get a job by ID."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def save_job(db: AsyncSession, user_id: int, job_id: int, notes: str = None):
    """Save a job for later review."""
    from app.models.saved_job import SavedJob
    
    saved_job = SavedJob(user_id=user_id, job_id=job_id, notes=notes)
    db.add(saved_job)
    await db.commit()
    await db.refresh(saved_job)
    return saved_job


async def unsave_job(db: AsyncSession, user_id: int, job_id: int) -> bool:
    """Remove a saved job."""
    from app.models.saved_job import SavedJob
    from sqlalchemy import delete
    
    result = await db.execute(
        delete(SavedJob).where(
            SavedJob.user_id == user_id,
            SavedJob.job_id == job_id
        )
    )
    await db.commit()
    return result.rowcount > 0


async def get_saved_jobs(db: AsyncSession, user_id: int) -> list[Job]:
    """Get all saved jobs for a user."""
    from app.models.saved_job import SavedJob
    
    result = await db.execute(
        select(Job)
        .join(SavedJob, SavedJob.job_id == Job.id)
        .where(SavedJob.user_id == user_id)
        .order_by(SavedJob.saved_at.desc())
    )
    return list(result.scalars().all())


async def is_job_saved(db: AsyncSession, user_id: int, job_id: int) -> bool:
    """Check if a job is saved by the user."""
    from app.models.saved_job import SavedJob
    
    result = await db.execute(
        select(SavedJob).where(
            SavedJob.user_id == user_id,
            SavedJob.job_id == job_id
        )
    )
    return result.scalar_one_or_none() is not None


async def get_related_jobs(db: AsyncSession, job: Job, limit: int = 5) -> list[Job]:
    """Get jobs related to the given job (same industry or similar title)."""
    # Simple implementation: jobs with same industry or similar keywords in title
    query = select(Job).where(Job.id != job.id)
    
    if job.industry:
        query = query.where(Job.industry == job.industry)
    
    query = query.order_by(Job.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())