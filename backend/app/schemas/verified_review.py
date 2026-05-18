"""
Pydantic schemas for the Verified Review system.
"""
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# === Request Schemas ===

class ReviewRequestCreate(BaseModel):
    """Schema for creating a new review request."""
    work_experience_id: UUID
    reviewer_email: str
    reviewer_name: Optional[str] = None
    relationship_type: str  # managed_me, colleague, client, mentored_me, i_managed
    personal_message: Optional[str] = None

    @field_validator('relationship_type')
    @classmethod
    def validate_relationship(cls, v):
        valid = ['managed_me', 'colleague', 'client', 'mentored_me', 'i_managed']
        if v not in valid:
            raise ValueError(f'relationship_type must be one of: {", ".join(valid)}')
        return v

    @field_validator('reviewer_email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email address')
        return v.lower().strip()


class ReviewSubmitPayload(BaseModel):
    """Schema for submitting a review (by the reviewer, no auth required)."""
    reviewer_name: str
    reviewer_title: str
    reviewer_company: str
    star_rating: int
    written_review: str
    endorsed_skills: List[str] = []

    @field_validator('star_rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Star rating must be between 1 and 5')
        return v

    @field_validator('written_review')
    @classmethod
    def validate_review_length(cls, v):
        if len(v.strip()) < 50:
            raise ValueError('Written review must be at least 50 characters')
        if len(v.strip()) > 500:
            raise ValueError('Written review must be at most 500 characters')
        return v.strip()

    @field_validator('reviewer_name')
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Reviewer name must be at least 2 characters')
        return v.strip()


# === Response Schemas ===

class ReviewRequestResponse(BaseModel):
    """Response schema for a review request (for the profile owner)."""
    id: UUID
    work_experience_id: UUID
    reviewer_email: str
    reviewer_name: Optional[str]
    relationship_type: str
    status: str
    expires_at: datetime
    reminder_sent_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: Optional[datetime]

    # Work experience context
    company: Optional[str] = None
    role_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewSubmitContext(BaseModel):
    """Context shown to the reviewer when they open the review form."""
    reviewee_name: str
    reviewee_headline: Optional[str] = None
    company: str
    role_title: str
    work_period: str  # e.g. "Jan 2023 – Dec 2024"
    relationship_type: str
    reviewer_email: str
    reviewer_name: Optional[str] = None
    is_expired: bool = False
    is_already_submitted: bool = False


class VerifiedReviewPublic(BaseModel):
    """Public representation of a completed review — shown on the profile."""
    id: UUID
    reviewer_name: str
    reviewer_title: Optional[str]
    reviewer_company: Optional[str]
    relationship_type: str
    star_rating: int
    written_review: str
    endorsed_skills: List[str]
    reviewer_has_proofile: bool = False
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ProofileScoreBreakdown(BaseModel):
    """Breakdown of how the Proofile Score is calculated — transparency is key."""
    total_score: int
    avg_star_rating: float
    star_rating_component: float  # 30%
    review_count: int
    review_count_component: float  # 25%
    avg_seniority: float
    seniority_component: float  # 25%
    profile_completeness: float
    completeness_component: float  # 10%
    cross_platform_bonus: float
    cross_platform_component: float  # 10%


class EnhancedPublicProfileResponse(BaseModel):
    """Extended public profile response with reviews and score."""
    username: str
    full_name: Optional[str]
    bio: Optional[str]
    profile_photo_url: Optional[str]
    headline: Optional[str] = None
    persona: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    user_id: int
    is_private: bool = False

    # Work experiences with nested reviews
    experiences: List[dict]

    # Skills
    skills_data: List[str] = []
    verified_skills: dict = {}  # skill -> endorsement count

    # Trust signal
    proofile_score: int = 0
    score_breakdown: Optional[ProofileScoreBreakdown] = None

    # Summary stats
    total_reviews: int = 0
    avg_rating: float = 0.0

    model_config = ConfigDict(from_attributes=True)
