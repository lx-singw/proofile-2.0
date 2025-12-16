"""
Pydantic schemas for Opportunity objects.
"""
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
import json
from typing import Optional, List

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
    employer_id: int
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
