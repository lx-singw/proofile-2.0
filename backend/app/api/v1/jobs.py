"""
API Endpoints for Jobs.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobRead, JobRecommendationRead, JobDetailRead
from app.services import job_service

router = APIRouter()

@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Create a new job posting. Only accessible by users with the 'employer' role.
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can post jobs.",
        )
    
    try:
        job = await job_service.create_job(db=db, job_in=job_in, employer_id=current_user.id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job posting"
        ) from e

@router.get("/", response_model=list[JobRead])
async def list_jobs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10,
):
    """
    List all available job postings.
    """
    jobs = await job_service.get_jobs(db, skip=skip, limit=limit)
    return jobs

@router.get("/recommendations", response_model=list[JobRead])
async def get_job_recommendations(
    limit: int = 5,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get job recommendations for the current user.
    Uses smart matching based on profile headline and primary goal.
    """
    jobs = await job_service.get_recommended_jobs(db, user=current_user, limit=limit)
    return jobs

@router.get("/recommendations/advanced", response_model=list[JobRecommendationRead])
async def get_advanced_job_recommendations(
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get advanced job recommendations with scoring breakdown.
    Matches based on skills, experience level, industry, and title.
    """
    results = await job_service.get_recommended_jobs_advanced(
        db, user=current_user, limit=limit
    )
    
    # Convert to response format
    return [
        {
            "job": job,
            "match_score": score,
            "score_breakdown": breakdown
        }
        for job, score, breakdown in results
    ]

@router.get("/saved", response_model=list[JobRead])
async def get_saved_jobs(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get all jobs saved by the current user.
    """
    jobs = await job_service.get_saved_jobs(db, user_id=current_user.id)
    return jobs

@router.get("/{job_id}", response_model=JobDetailRead)
async def get_job_details(
    job_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get detailed job information including save status and related jobs.
    """
    job = await job_service.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if user has saved this job
    is_saved = await job_service.is_job_saved(db, user_id=current_user.id, job_id=job_id)
    
    # Get related jobs
    related_jobs = await job_service.get_related_jobs(db, job, limit=5)
    
    return {
        "job": job,
        "is_saved": is_saved,
        "related_jobs": related_jobs
    }

@router.post("/{job_id}/save", status_code=status.HTTP_201_CREATED)
async def save_job(
    job_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Save a job for later review.
    """
    # Check if job exists
    job = await job_service.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already saved
    if await job_service.is_job_saved(db, user_id=current_user.id, job_id=job_id):
        raise HTTPException(status_code=400, detail="Job already saved")
    
    try:
        await job_service.save_job(db, user_id=current_user.id, job_id=job_id)
        return {"message": "Job saved successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save job"
        ) from e

@router.delete("/{job_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_job(
    job_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Remove a saved job.
    """
    success = await job_service.unsave_job(db, user_id=current_user.id, job_id=job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved job not found")
    return None