"""
Portal API Endpoints

Public routes for jobs portal.
Most endpoints do NOT require authentication (SEO-friendly).
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_sync_db
from app.api.deps import get_current_user_optional, get_current_user
from app.models.user import User
from app.services.portal_service import PortalService
from app.schemas.portal import (
    PortalSearchParams, PortalSearchResponse,
    PortalJobCard, PortalJobDetail,
    PortalJobCreate, PortalJobUpdate,
    PortalJobView, PortalJobApply
)

router = APIRouter(prefix="/portal", tags=["portal"])


# ==================== Public Search Endpoints ====================

@router.get("/jobs", response_model=PortalSearchResponse)
async def search_jobs(
    q: Optional[str] = Query(None, description="Search query"),
    location: Optional[str] = Query(None),
    location_type: Optional[str] = Query(None, description="remote, onsite, hybrid"),
    category: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None, description="entry, mid, senior, lead"),
    job_type: Optional[str] = Query(None, description="full-time, part-time, contract"),
    salary_min: Optional[int] = Query(None),
    salary_max: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    posted_within_days: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("posted_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_sync_db)
):
    """
    Search jobs in the public portal.
    No authentication required.
    
    - **q**: Search query (searches title, company, description)
    - **location**: Filter by location
    - **location_type**: Filter by remote/onsite/hybrid
    - **category**: Filter by job category
    - **experience_level**: Filter by experience level
    - **job_type**: Filter by job type
    - **salary_min/max**: Salary range filter
    - **source**: Filter by job source (pnet, linkedin, etc.)
    - **posted_within_days**: Only show jobs posted within N days
    """
    params = PortalSearchParams(
        q=q,
        location=location,
        location_type=location_type,
        category=category,
        experience_level=experience_level,
        job_type=job_type,
        salary_min=salary_min,
        salary_max=salary_max,
        source=source,
        posted_within_days=posted_within_days,
        page=page,
        size=size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    service = PortalService(db)
    return service.search_jobs(params)


@router.get("/jobs/{job_id}", response_model=PortalJobDetail)
async def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_sync_db)
):
    """
    Get job details by ID.
    No authentication required.
    """
    service = PortalService(db)
    job = service.get_job_by_id(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job


@router.get("/jobs/slug/{slug}", response_model=PortalJobDetail)
async def get_job_by_slug(
    slug: str,
    db: Session = Depends(get_sync_db)
):
    """
    Get job details by SEO-friendly slug.
    No authentication required.
    """
    service = PortalService(db)
    job = service.get_job_by_slug(slug)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job


# ==================== Featured & Trending ====================

@router.get("/featured", response_model=list[PortalJobCard])
async def get_featured_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_sync_db)
):
    """Get featured/verified jobs"""
    service = PortalService(db)
    return service.get_featured_jobs(limit)


@router.get("/trending", response_model=list[PortalJobCard])
async def get_trending_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_sync_db)
):
    """Get trending jobs (most views/applies in last 7 days)"""
    service = PortalService(db)
    return service.get_trending_jobs(limit)


@router.get("/recent", response_model=list[PortalJobCard])
async def get_recent_jobs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_sync_db)
):
    """Get most recently posted jobs"""
    service = PortalService(db)
    return service.get_recent_jobs(limit)


# ==================== Analytics Endpoints ====================

@router.post("/jobs/{job_id}/view")
async def record_job_view(
    job_id: int,
    request: Request,
    db: Session = Depends(get_sync_db)
):
    """Record a job view (for analytics)"""
    # View is already incremented in get_job_by_id
    # This endpoint is for explicit tracking from frontend
    return {"status": "recorded"}


@router.post("/jobs/{job_id}/apply")
async def record_apply_click(
    job_id: int,
    data: PortalJobApply,
    db: Session = Depends(get_sync_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Record when user clicks apply.
    
    - If authenticated: Records user info for analytics
    - If anonymous: Just increments counter
    """
    service = PortalService(db)
    success = service.record_apply_click(job_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # If user is authenticated and applying via Proofile
    if current_user and data.apply_type == "proofile":
        # TODO: Create application record
        return {
            "status": "applied",
            "apply_type": "proofile",
            "redirect": f"/jobs/{job_id}/apply"
        }
    
    return {
        "status": "recorded",
        "apply_type": data.apply_type
    }


# ==================== Categories & Stats ====================

@router.get("/categories")
async def get_categories(
    db: Session = Depends(get_sync_db)
):
    """Get job categories with counts"""
    service = PortalService(db)
    facets = service._get_facets()
    return facets.categories


@router.get("/stats")
async def get_portal_stats(
    db: Session = Depends(get_sync_db)
):
    """Get portal statistics"""
    from app.models.portal_job import PortalJob
    from sqlalchemy import func
    
    total_jobs = db.query(func.count(PortalJob.id)).filter(
        PortalJob.is_active == True
    ).scalar()
    
    total_companies = db.query(func.count(func.distinct(PortalJob.company))).filter(
        PortalJob.is_active == True
    ).scalar()
    
    remote_jobs = db.query(func.count(PortalJob.id)).filter(
        PortalJob.is_active == True,
        PortalJob.location_type == "remote"
    ).scalar()
    
    return {
        "total_jobs": total_jobs,
        "total_companies": total_companies,
        "remote_jobs": remote_jobs
    }


# ==================== Admin Endpoints (Protected) ====================

@router.post("/admin/jobs", response_model=PortalJobCard, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: PortalJobCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job (admin only)"""
    # TODO: Add admin role check
    service = PortalService(db)
    job = service.create_job(data)
    return service._to_job_card(job)


@router.put("/admin/jobs/{job_id}", response_model=PortalJobCard)
async def update_job(
    job_id: int,
    data: PortalJobUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user)
):
    """Update a job (admin only)"""
    # TODO: Add admin role check
    service = PortalService(db)
    job = service.update_job(job_id, data)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return service._to_job_card(job)
