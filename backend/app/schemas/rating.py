from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class RelationshipType(str, Enum):
    COLLEAGUE = "colleague"
    MANAGER = "manager"
    DIRECT_REPORT = "direct_report"
    CLIENT = "client"


class RatingAttribute(str, Enum):
    TECHNICAL_SKILLS = "technical_skills"
    COMMUNICATION = "communication"
    RELIABILITY = "reliability"
    TEAMWORK = "teamwork"
    PROBLEM_SOLVING = "problem_solving"
    LEADERSHIP = "leadership"


class WorkAgainOption(str, Enum):
    DEFINITELY = "definitely"
    PROBABLY = "probably"
    MAYBE = "maybe"
    PROBABLY_NOT = "probably_not"


class RatingCreate(BaseModel):
    """Schema for creating a new rating with anti-gaming measures"""
    
    rated_user_id: int = Field(..., description="User being rated")
    relationship: RelationshipType = Field(..., description="Type of work relationship")
    company: str = Field(..., min_length=1, max_length=200, description="Company where you worked together")
    start_date: datetime = Field(..., description="Start date of working relationship")
    end_date: Optional[datetime] = Field(None, description="End date of working relationship")
    
    # Attribute ratings (1-5 scale)
    attribute_ratings: dict[str, int] = Field(..., description="Ratings for specific attributes")
    
    # Text feedback
    strengths: str = Field(..., min_length=10, max_length=1000, description="Key strengths (10-1000 chars)")
    areas_for_growth: Optional[str] = Field(None, max_length=1000, description="Areas for improvement (optional, private)")
    
    # Overall assessment
    work_again: WorkAgainOption = Field(..., description="Would you work with them again?")
    
    # Visibility settings
    is_public: bool = Field(default=True, description="Should rating be public?")
    is_anonymous: bool = Field(default=False, description="Hide rater identity? (only for private ratings)")
    
    class Config:
        use_enum_values = True
    
    @validator("end_date")
    def end_date_after_start(cls, v, values):
        """Ensure end_date is after start_date"""
        if v and "start_date" in values:
            if v <= values["start_date"]:
                raise ValueError("End date must be after start date")
        return v
    
    @validator("attribute_ratings")
    def validate_attribute_ratings(cls, v):
        """Validate that all ratings are 1-5 and cover required attributes"""
        if not v:
            raise ValueError("At least 3 attribute ratings required")
        
        for attr_id, rating in v.items():
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                raise ValueError(f"Rating for {attr_id} must be between 1 and 5")
        
        if len(v) < 3:
            raise ValueError("At least 3 attributes must be rated")
        
        return v
    
    @validator("is_anonymous")
    def validate_anonymous_option(cls, v, values):
        """Anonymous ratings only allowed if private"""
        if v and values.get("is_public"):
            raise ValueError("Anonymous ratings must be private")
        return v


class RatingResponse(BaseModel):
    """Response schema for a rating"""
    
    id: int
    rater_id: int
    rated_user_id: int
    relationship: RelationshipType
    company: str
    start_date: datetime
    end_date: Optional[datetime]
    
    attribute_ratings: dict[str, int]
    overall_rating: float  # Calculated average
    
    strengths: str
    areas_for_growth: Optional[str]
    work_again: WorkAgainOption
    
    is_public: bool
    is_anonymous: bool
    rater_name: Optional[str]  # None if anonymous
    
    created_at: datetime
    updated_at: datetime
    
    # Anti-gaming flags
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class RatingListResponse(BaseModel):
    """Response for listing ratings with pagination"""
    
    ratings: list[RatingResponse]
    total: int
    average_rating: float
    rating_counts: dict[str, int]  # Distribution of ratings
