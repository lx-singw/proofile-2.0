"""
Pydantic schemas for Job objects.
"""
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
import json

# --- Base Schema ---
class JobBase(BaseModel):
    """Shared attributes for a job."""
    title: str
    description: str
    company_name: str
    location: str | None = None
    job_type: str | None = None
    required_skills: list[str] | None = None
    experience_level: str | None = None
    industry: str | None = None
    salary_range: str | None = None
    
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
class JobCreate(JobBase):
    """Schema for creating a new job."""
    pass

class JobUpdate(JobBase):
    """Schema for updating an existing job. All fields are optional."""
    title: str | None = None
    description: str | None = None
    company_name: str | None = None

class JobRead(JobBase):
    """Schema for reading a job from the API."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    employer_id: int
    created_at: datetime
    updated_at: datetime

class JobRecommendationRead(BaseModel):
    """Job with match score and breakdown."""
    job: JobRead
    match_score: int
    score_breakdown: dict[str, int]
    model_config = ConfigDict(from_attributes=True)

class JobDetailRead(BaseModel):
    """Detailed job information with save status and related jobs."""
    job: JobRead
    is_saved: bool
    related_jobs: list[JobRead]
    model_config = ConfigDict(from_attributes=True)