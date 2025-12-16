"""
Portal Service

Business logic for public jobs portal.
Handles job search, filtering, and aggregation.
"""
import re
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy import select, func, desc, asc, and_, or_, text
from sqlalchemy.orm import Session

from app.models.portal_job import PortalJob
from app.schemas.portal import (
    PortalSearchParams, PortalSearchResponse,
    PortalJobCard, PortalJobDetail,
    PortalFacets, FacetItem,
    PortalJobCreate, PortalJobUpdate
)


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


class PortalService:
    """Service for public jobs portal operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ==================== Search Operations ====================
    
    def search_jobs(self, params: PortalSearchParams) -> PortalSearchResponse:
        """Search jobs with filters and pagination"""
        query = self.db.query(PortalJob).filter(PortalJob.is_active == True)
        
        # Text search
        if params.q:
            search_term = f"%{params.q.lower()}%"
            query = query.filter(
                or_(
                    func.lower(PortalJob.title).like(search_term),
                    func.lower(PortalJob.company).like(search_term),
                    func.lower(PortalJob.description).like(search_term),
                )
            )
        
        # Location filter
        if params.location:
            location_term = f"%{params.location.lower()}%"
            query = query.filter(
                or_(
                    func.lower(PortalJob.location).like(location_term),
                    func.lower(PortalJob.city).like(location_term),
                )
            )
        
        # Location type filter
        if params.location_type:
            query = query.filter(PortalJob.location_type == params.location_type)
        
        # Category filter
        if params.category:
            query = query.filter(PortalJob.category == params.category)
        
        # Experience level filter
        if params.experience_level:
            query = query.filter(PortalJob.experience_level == params.experience_level)
        
        # Job type filter
        if params.job_type:
            query = query.filter(PortalJob.job_type == params.job_type)
        
        # Salary range filter
        if params.salary_min:
            query = query.filter(
                or_(
                    PortalJob.salary_max >= params.salary_min,
                    PortalJob.salary_min >= params.salary_min,
                )
            )
        if params.salary_max:
            query = query.filter(
                or_(
                    PortalJob.salary_min <= params.salary_max,
                    PortalJob.salary_max <= params.salary_max,
                )
            )
        
        # Skills filter
        if params.skills:
            # PostgreSQL array overlap
            query = query.filter(PortalJob.skills.overlap(params.skills))
        
        # Source filter
        if params.source:
            query = query.filter(PortalJob.source == params.source)
        
        # Posted within days filter
        if params.posted_within_days:
            cutoff = datetime.utcnow() - timedelta(days=params.posted_within_days)
            query = query.filter(PortalJob.posted_at >= cutoff)
        
        # Get total count before pagination
        total = query.count()
        
        # Sorting
        sort_column = getattr(PortalJob, params.sort_by, PortalJob.posted_at)
        if params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Pagination
        offset = (params.page - 1) * params.size
        jobs = query.offset(offset).limit(params.size).all()
        
        # Calculate pagination info
        pages = (total + params.size - 1) // params.size
        has_next = params.page < pages
        has_prev = params.page > 1
        
        # Convert to response
        job_cards = [self._to_job_card(job) for job in jobs]
        
        # Get facets (only on first page to avoid performance hit)
        facets = self._get_facets() if params.page == 1 else None
        
        return PortalSearchResponse(
            jobs=job_cards,
            total=total,
            page=params.page,
            size=params.size,
            pages=pages,
            has_next=has_next,
            has_prev=has_prev,
            facets=facets
        )
    
    # ==================== Job Details ====================
    
    def get_job_by_id(self, job_id: int) -> Optional[PortalJobDetail]:
        """Get job details by ID"""
        job = self.db.query(PortalJob).filter(
            PortalJob.id == job_id,
            PortalJob.is_active == True
        ).first()
        
        if not job:
            return None
        
        # Increment view count
        job.views_count += 1
        self.db.commit()
        
        return self._to_job_detail(job)
    
    def get_job_by_slug(self, slug: str) -> Optional[PortalJobDetail]:
        """Get job details by slug"""
        job = self.db.query(PortalJob).filter(
            PortalJob.slug == slug,
            PortalJob.is_active == True
        ).first()
        
        if not job:
            return None
        
        # Increment view count
        job.views_count += 1
        self.db.commit()
        
        return self._to_job_detail(job)
    
    def get_related_jobs(self, job_id: int, limit: int = 5) -> List[PortalJobCard]:
        """Get related jobs based on category, skills, or company"""
        job = self.db.query(PortalJob).filter(PortalJob.id == job_id).first()
        if not job:
            return []
        
        query = self.db.query(PortalJob).filter(
            PortalJob.id != job_id,
            PortalJob.is_active == True,
            or_(
                PortalJob.category == job.category,
                PortalJob.company == job.company,
                PortalJob.skills.overlap(job.skills) if job.skills else False
            )
        ).order_by(desc(PortalJob.posted_at)).limit(limit)
        
        return [self._to_job_card(j) for j in query.all()]
    
    # ==================== Featured & Trending ====================
    
    def get_featured_jobs(self, limit: int = 10) -> List[PortalJobCard]:
        """Get featured/verified jobs"""
        jobs = self.db.query(PortalJob).filter(
            PortalJob.is_active == True,
            PortalJob.is_verified == True
        ).order_by(desc(PortalJob.posted_at)).limit(limit).all()
        
        return [self._to_job_card(job) for job in jobs]
    
    def get_trending_jobs(self, limit: int = 10) -> List[PortalJobCard]:
        """Get trending jobs based on views and applies"""
        jobs = self.db.query(PortalJob).filter(
            PortalJob.is_active == True,
            PortalJob.posted_at >= datetime.utcnow() - timedelta(days=7)
        ).order_by(
            desc(PortalJob.views_count + PortalJob.applies_count * 2)
        ).limit(limit).all()
        
        return [self._to_job_card(job) for job in jobs]
    
    def get_recent_jobs(self, limit: int = 20) -> List[PortalJobCard]:
        """Get most recent jobs"""
        jobs = self.db.query(PortalJob).filter(
            PortalJob.is_active == True
        ).order_by(desc(PortalJob.posted_at)).limit(limit).all()
        
        return [self._to_job_card(job) for job in jobs]
    
    # ==================== Admin Operations ====================
    
    def create_job(self, data: PortalJobCreate) -> PortalJob:
        """Create a new portal job"""
        job = PortalJob(
            external_id=data.external_id,
            source=data.source,
            source_url=data.source_url,
            title=data.title,
            company=data.company,
            location=data.location,
            location_type=data.location_type,
            salary_min=data.salary_min,
            salary_max=data.salary_max,
            salary_currency=data.salary_currency,
            description=data.description,
            description_html=data.description_html,
            skills=data.skills,
            experience_level=data.experience_level,
            education_requirement=data.education_requirement,
            years_experience_min=data.years_experience_min,
            years_experience_max=data.years_experience_max,
            category=data.category,
            job_type=data.job_type,
            posted_at=data.posted_at or datetime.utcnow(),
            expires_at=data.expires_at,
            slug=self._generate_slug(data.title, data.company),
        )
        
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job
    
    def update_job(self, job_id: int, data: PortalJobUpdate) -> Optional[PortalJob]:
        """Update a portal job"""
        job = self.db.query(PortalJob).filter(PortalJob.id == job_id).first()
        if not job:
            return None
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(job, field, value)
        
        if data.title:
            job.slug = self._generate_slug(data.title, job.company)
        
        self.db.commit()
        self.db.refresh(job)
        return job
    
    def record_apply_click(self, job_id: int) -> bool:
        """Record when user clicks apply"""
        job = self.db.query(PortalJob).filter(PortalJob.id == job_id).first()
        if not job:
            return False
        
        job.applies_count += 1
        self.db.commit()
        return True
    
    # ==================== Helper Methods ====================
    
    def _to_job_card(self, job: PortalJob) -> PortalJobCard:
        """Convert model to card response"""
        return PortalJobCard(
            id=job.id,
            slug=job.slug,
            title=job.title,
            company=job.company,
            company_logo_url=job.company_logo_url,
            location=job.location,
            location_type=job.location_type,
            salary_display=job.salary_display,
            skills=job.skills,
            experience_level=job.experience_level,
            category=job.category,
            job_type=job.job_type,
            is_remote=job.is_remote,
            posted_at=job.posted_at,
            source=job.source
        )
    
    def _to_job_detail(self, job: PortalJob) -> PortalJobDetail:
        """Convert model to detail response"""
        related = self.get_related_jobs(job.id, limit=5)
        
        return PortalJobDetail(
            id=job.id,
            slug=job.slug,
            title=job.title,
            company=job.company,
            company_logo_url=job.company_logo_url,
            location=job.location,
            location_type=job.location_type,
            salary_display=job.salary_display,
            skills=job.skills,
            experience_level=job.experience_level,
            category=job.category,
            job_type=job.job_type,
            is_remote=job.is_remote,
            posted_at=job.posted_at,
            source=job.source,
            description=job.description,
            description_html=job.description_html,
            source_url=job.source_url,
            education_requirement=job.education_requirement,
            years_experience_min=job.years_experience_min,
            years_experience_max=job.years_experience_max,
            expires_at=job.expires_at,
            views_count=job.views_count,
            applies_count=job.applies_count,
            related_jobs=related
        )
    
    def _get_facets(self) -> PortalFacets:
        """Get aggregated facet counts for filtering UI"""
        facets = PortalFacets()
        
        # Categories
        category_counts = self.db.query(
            PortalJob.category,
            func.count(PortalJob.id)
        ).filter(
            PortalJob.is_active == True,
            PortalJob.category.isnot(None)
        ).group_by(PortalJob.category).order_by(desc(func.count(PortalJob.id))).limit(10).all()
        
        facets.categories = [
            FacetItem(value=cat, label=cat.replace("_", " ").title(), count=count)
            for cat, count in category_counts if cat
        ]
        
        # Locations
        location_counts = self.db.query(
            PortalJob.location,
            func.count(PortalJob.id)
        ).filter(
            PortalJob.is_active == True,
            PortalJob.location.isnot(None)
        ).group_by(PortalJob.location).order_by(desc(func.count(PortalJob.id))).limit(10).all()
        
        facets.locations = [
            FacetItem(value=loc, label=loc, count=count)
            for loc, count in location_counts if loc
        ]
        
        # Experience levels
        exp_counts = self.db.query(
            PortalJob.experience_level,
            func.count(PortalJob.id)
        ).filter(
            PortalJob.is_active == True,
            PortalJob.experience_level.isnot(None)
        ).group_by(PortalJob.experience_level).all()
        
        facets.experience_levels = [
            FacetItem(value=exp, label=exp.title(), count=count)
            for exp, count in exp_counts if exp
        ]
        
        # Job types
        type_counts = self.db.query(
            PortalJob.job_type,
            func.count(PortalJob.id)
        ).filter(
            PortalJob.is_active == True,
            PortalJob.job_type.isnot(None)
        ).group_by(PortalJob.job_type).all()
        
        facets.job_types = [
            FacetItem(value=jt, label=jt.replace("-", " ").title(), count=count)
            for jt, count in type_counts if jt
        ]
        
        # Sources
        source_counts = self.db.query(
            PortalJob.source,
            func.count(PortalJob.id)
        ).filter(
            PortalJob.is_active == True
        ).group_by(PortalJob.source).all()
        
        facets.sources = [
            FacetItem(value=src, label=src.upper(), count=count)
            for src, count in source_counts
        ]
        
        return facets
    
    def _generate_slug(self, title: str, company: str) -> str:
        """Generate URL-friendly slug"""
        base_slug = slugify(f"{title}-{company}")
        
        # Check for uniqueness
        existing = self.db.query(PortalJob).filter(
            PortalJob.slug.like(f"{base_slug}%")
        ).count()
        
        if existing:
            return f"{base_slug}-{existing + 1}"
        return base_slug
