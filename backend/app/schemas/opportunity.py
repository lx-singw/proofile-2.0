"""
Pydantic schemas for Opportunity objects.
"""
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date, datetime
import json
from typing import Optional, List, Any

# --- Base Schema ---
class OpportunityBase(BaseModel):
    """Shared attributes for an opportunity."""
    title: str
    description: str
    company_name: str
    location: str | None = None
    opportunity_type: str | None = None  # full-time, part-time, contract, internship, learnership, etc.
    category: str = 'jobs'  # 'jobs' or 'training_skills_programs'
    required_skills: list[str] | None = None
    experience_level: str | None = None
    industry: str | None = None
    salary_range: str | None = None
    requires_verification_level: int = 0  # 0=none, 1=L1 (skill), 2=L2 (employment), 3=L3 (identity)
    verified_candidates_only: bool = False
    
    @field_validator('required_skills', mode='before')
    @classmethod
    def parse_skills(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

# --- Schemas for API Operations ---
class OpportunityCreate(OpportunityBase):
    """Schema for creating a new opportunity."""
    pass

class OpportunityUpdate(OpportunityBase):
    """Schema for updating an existing opportunity. All fields are optional."""
    title: str | None = None
    description: str | None = None
    company_name: str | None = None
    category: str | None = None

def _parse_json_field(v: Any) -> Any:
    """Parse a JSON string into a Python object; pass through lists/dicts as-is."""
    if v is None:
        return None
    if isinstance(v, (list, dict)):
        return v
    if isinstance(v, str):
        try:
            return json.loads(v)
        except Exception:
            return None
    return v

class OpportunityRead(OpportunityBase):
    """Schema for reading an opportunity from the API."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    employer_id: int | None
    source: str | None = None
    source_id: str | None = None
    source_url: str | None = None
    source_platform: str | None = None
    remote_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_visible: bool = True
    quality_score: float | None = None
    trust_score: float | None = None
    engagement_rate: float | None = None
    ai_status: str | None = None
    ai_confidence_score: float | None = None
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    application_deadline_date: date | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    application_url: str | None = None
    contact_website: str | None = None
    is_direct: bool = False
    created_at: datetime
    updated_at: datetime

    # Rich AI-extracted fields — returned as parsed objects
    benefits: list[str] | None = None
    required_documents: list[str] | None = None
    tags: list[str] | None = None
    red_flags: list[str] | None = None
    scam_score: float | None = None
    duration: str | None = None
    start_date: date | None = None
    qualification_requirements: dict[str, Any] | None = None
    experience_requirements: dict[str, Any] | None = None
    skills_structured: list[dict[str, Any]] | None = None
    knowledge_requirements: dict[str, Any] | None = None
    conditions_of_employment: list[str] | None = None

    @field_validator(
        'benefits', 'required_documents', 'tags', 'red_flags',
        'conditions_of_employment', 'skills_structured',
        mode='before',
    )
    @classmethod
    def parse_json_list(cls, v):
        result = _parse_json_field(v)
        if result is None:
            return None
        return result if isinstance(result, list) else None

    @field_validator(
        'qualification_requirements', 'experience_requirements', 'knowledge_requirements',
        mode='before',
    )
    @classmethod
    def parse_json_dict(cls, v):
        result = _parse_json_field(v)
        if result is None:
            return None
        return result if isinstance(result, dict) else None

class OpportunityRecommendationRead(BaseModel):
    """Opportunity with match score and breakdown."""
    opportunity: OpportunityRead
    match_score: int
    score_breakdown: dict[str, int]
    model_config = ConfigDict(from_attributes=True)

class OpportunityDetailRead(BaseModel):
    """Detailed opportunity information with save status and related opportunities."""
    opportunity: OpportunityRead
    is_saved: bool
    related_opportunities: list[OpportunityRead]
    model_config = ConfigDict(from_attributes=True)


# Backward compatibility aliases
JobBase = OpportunityBase
JobCreate = OpportunityCreate
JobUpdate = OpportunityUpdate
JobRead = OpportunityRead
JobRecommendationRead = OpportunityRecommendationRead
JobDetailRead = OpportunityDetailRead

# --- Base Schema ---
class OpportunityBase(BaseModel):
    """Shared attributes for an opportunity."""
    title: str
    description: str
    company_name: str
    location: str | None = None
    opportunity_type: str | None = None  # full-time, part-time, contract, internship, learnership, etc.
    category: str = 'jobs'  # 'jobs' or 'training_skills_programs'
    required_skills: list[str] | None = None
    experience_level: str | None = None
    industry: str | None = None
    salary_range: str | None = None
    requires_verification_level: int = 0  # 0=none, 1=L1 (skill), 2=L2 (employment), 3=L3 (identity)
    verified_candidates_only: bool = False
    
    @field_validator('required_skills', mode='before')
    @classmethod
    def parse_skills(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

# --- Schemas for API Operations ---
class OpportunityCreate(OpportunityBase):
    """Schema for creating a new opportunity."""
    pass

class OpportunityUpdate(OpportunityBase):
    """Schema for updating an existing opportunity. All fields are optional."""
    title: str | None = None
    description: str | None = None
    company_name: str | None = None
    category: str | None = None

class OpportunityRead(OpportunityBase):
    """Schema for reading an opportunity from the API."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    employer_id: int | None
    source: str | None = None
    source_id: str | None = None
    source_url: str | None = None
    source_platform: str | None = None
    remote_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_visible: bool = True
    quality_score: float | None = None
    trust_score: float | None = None
    engagement_rate: float | None = None
    ai_status: str | None = None
    ai_confidence_score: float | None = None
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    application_deadline_date: date | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    application_url: str | None = None
    is_direct: bool = False
    created_at: datetime
    updated_at: datetime

class OpportunityRecommendationRead(BaseModel):
    """Opportunity with match score and breakdown."""
    opportunity: OpportunityRead
    match_score: int
    score_breakdown: dict[str, int]
    model_config = ConfigDict(from_attributes=True)

class OpportunityDetailRead(BaseModel):
    """Detailed opportunity information with save status and related opportunities."""
    opportunity: OpportunityRead
    is_saved: bool
    related_opportunities: list[OpportunityRead]
    model_config = ConfigDict(from_attributes=True)


# Backward compatibility aliases
JobBase = OpportunityBase
JobCreate = OpportunityCreate
JobUpdate = OpportunityUpdate
JobRead = OpportunityRead
JobRecommendationRead = OpportunityRecommendationRead
JobDetailRead = OpportunityDetailRead
