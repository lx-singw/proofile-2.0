"""
Portal Schemas

Pydantic schemas for public jobs portal.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from decimal import Decimal


# ==================== Job Schemas ====================

class PortalJobBase(BaseModel):
    """Base portal job fields"""
    title: str
    company: str
    location: Optional[str] = None
    location_type: Optional[str] = None  # remote, onsite, hybrid
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    salary_currency: str = "ZAR"
    category: Optional[str] = None
    job_type: Optional[str] = None  # full-time, part-time, contract


class PortalJobCard(BaseModel):
    """Compact job card for listings"""
    id: int
    slug: Optional[str] = None
    title: str
    company: str
    company_logo_url: Optional[str] = None
    location: Optional[str] = None
    location_type: Optional[str] = None
    salary_display: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    category: Optional[str] = None
    job_type: Optional[str] = None
    opportunity_category: Optional[str] = None  # 'jobs', 'training_skills_programs'
    opportunity_type: Optional[str] = None  # 'employment', 'internship', etc.
    is_remote: bool = False
    posted_at: Optional[datetime] = None
    source: str
    
    class Config:
        from_attributes = True


class PortalJobDetail(PortalJobCard):
    """Full job details"""
    description: Optional[str] = None
    description_html: Optional[str] = None
    source_url: Optional[str] = None
    education_requirement: Optional[str] = None
    years_experience_min: Optional[int] = None
    years_experience_max: Optional[int] = None
    expires_at: Optional[datetime] = None
    views_count: int = 0
    applies_count: int = 0
    
    # Related jobs (populated by service)
    related_jobs: List[PortalJobCard] = []
    
    class Config:
        from_attributes = True


# ==================== Search & Filter Schemas ====================

class PortalSearchParams(BaseModel):
    """Search parameters for portal"""
    q: Optional[str] = None  # Search query
    location: Optional[str] = None
    location_type: Optional[str] = None  # remote, onsite, hybrid
    category: Optional[str] = None
    experience_level: Optional[str] = None  # entry, mid, senior, lead
    job_type: Optional[str] = None  # full-time, part-time, contract
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills: Optional[List[str]] = None
    source: Optional[str] = None
    posted_within_days: Optional[int] = None  # Jobs posted in last N days
    opportunity_category: Optional[str] = None  # 'jobs', 'training_skills_programs'
    opportunity_types: Optional[List[str]] = None  # ['employment', 'internship', ...]
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="posted_at", pattern="^(posted_at|salary_max|views_count)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class PortalSearchResponse(BaseModel):
    """Search results"""
    jobs: List[PortalJobCard]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool
    
    # Facets for filtering
    facets: Optional["PortalFacets"] = None


class PortalFacets(BaseModel):
    """Aggregated facets for filtering UI"""
    categories: List["FacetItem"] = []
    locations: List["FacetItem"] = []
    experience_levels: List["FacetItem"] = []
    job_types: List["FacetItem"] = []
    sources: List["FacetItem"] = []
    opportunity_categories: List["FacetItem"] = []
    opportunity_types: List["FacetItem"] = []


class FacetItem(BaseModel):
    """Single facet item with count"""
    value: str
    label: str
    count: int


# ==================== Analytics Schemas ====================

class PortalJobView(BaseModel):
    """Track job view"""
    job_id: int
    referrer: Optional[str] = None
    user_agent: Optional[str] = None


class PortalJobApply(BaseModel):
    """Track apply click"""
    job_id: int
    apply_type: str = "external"  # external, proofile


# ==================== Admin Schemas ====================

class PortalJobCreate(PortalJobBase):
    """For manually adding jobs"""
    external_id: Optional[str] = None
    source: str = "manual"
    source_url: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    education_requirement: Optional[str] = None
    years_experience_min: Optional[int] = None
    years_experience_max: Optional[int] = None
    posted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class PortalJobUpdate(BaseModel):
    """For updating jobs"""
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


# Update forward references
PortalSearchResponse.model_rebuild()
PortalFacets.model_rebuild()
