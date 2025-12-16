"""
Personalization Service

Central service that resolves user personalization context
and provides it to all platform features (Feed, AI, Coaching, etc.)
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.models.user import User

logger = logging.getLogger(__name__)


# =============================================================================
# Pydantic Schemas
# =============================================================================

class PersonalizationContext(BaseModel):
    """Complete personalization context for a user (11 dimensions)."""
    
    # Dimension 1: Opportunity Category
    opportunity_preference: Optional[str] = None  # jobs, training_skills_programs, both
    
    # Dimension 2: User Persona
    persona: Optional[str] = None  # job_seeker, recruiter, employer, mentor, student
    
    # Dimension 3: Industry/Sector
    primary_industry: Optional[str] = None
    
    # Dimension 4: Experience Level
    experience_level: Optional[str] = None  # entry_student, junior, mid_level, senior, executive
    years_experience: Optional[int] = None
    
    # Dimension 5: Location/Province
    province: Optional[str] = None
    city: Optional[str] = None
    willing_to_relocate: bool = False
    
    # Dimension 6: Career Intent
    career_intent: Optional[str] = None  # actively_looking, passively_open, etc.
    available_from: Optional[str] = None
    notice_period_weeks: Optional[int] = None
    
    # Dimension 7: Verification Level
    trust_score: int = 0
    verification_level: str = "unverified"  # Computed from trust_score
    
    # Dimension 8: Skills (simplified)
    skills: List[str] = []
    
    # Dimension 9: Salary Expectations
    salary_expectation_min: Optional[int] = None
    salary_expectation_max: Optional[int] = None
    salary_negotiable: bool = True
    
    # Dimension 10: Work Mode
    work_mode_preference: Optional[str] = None  # remote_only, hybrid, office_based, etc.
    max_commute_minutes: Optional[int] = None
    
    # Dimension 11: Engagement (inferred - placeholder)
    engagement_pattern: str = "new_user"  # daily_active, weekly_visitor, returning, new_user, power_user
    
    class Config:
        from_attributes = True


class PersonalizationUpdate(BaseModel):
    """Partial update for user personalization preferences."""
    province: Optional[str] = None
    city: Optional[str] = None
    willing_to_relocate: Optional[bool] = None
    career_intent: Optional[str] = None
    available_from: Optional[str] = None
    notice_period_weeks: Optional[int] = None
    salary_expectation_min: Optional[int] = None
    salary_expectation_max: Optional[int] = None
    salary_negotiable: Optional[bool] = None
    work_mode_preference: Optional[str] = None
    max_commute_minutes: Optional[int] = None
    years_experience: Optional[int] = None


# =============================================================================
# Personalization Service
# =============================================================================

class PersonalizationService:
    """
    Central service that resolves user personalization context
    and provides it to all platform features.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_context(self, user_id: int) -> PersonalizationContext:
        """
        Builds complete personalization context for a user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            PersonalizationContext with all 11 dimensions
        """
        user = await self.db.get(User, user_id)
        if not user:
            return PersonalizationContext()
        
        # Parse skills from JSON text field
        skills = []
        if user.skills:
            try:
                import json
                skills = json.loads(user.skills)
                if isinstance(skills, str):
                    skills = [s.strip() for s in skills.split(",")]
            except (json.JSONDecodeError, AttributeError):
                skills = []
        
        # Compute verification level from trust score
        verification_level = self._compute_verification_level(user.trust_score or 0)
        
        return PersonalizationContext(
            # Dimension 1: Opportunity Category
            opportunity_preference=user.opportunity_preference,
            
            # Dimension 2: Persona
            persona=user.persona,
            
            # Dimension 3: Industry
            primary_industry=user.industry,
            
            # Dimension 4: Experience
            experience_level=user.experience_level,
            years_experience=getattr(user, 'years_experience', None),
            
            # Dimension 5: Location
            province=getattr(user, 'province', None),
            city=getattr(user, 'city', None),
            willing_to_relocate=getattr(user, 'willing_to_relocate', False),
            
            # Dimension 6: Career Intent
            career_intent=getattr(user, 'career_intent', None),
            available_from=getattr(user, 'available_from', None),
            notice_period_weeks=getattr(user, 'notice_period_weeks', None),
            
            # Dimension 7: Verification
            trust_score=user.trust_score or 0,
            verification_level=verification_level,
            
            # Dimension 8: Skills
            skills=skills,
            
            # Dimension 9: Salary
            salary_expectation_min=getattr(user, 'salary_expectation_min', None),
            salary_expectation_max=getattr(user, 'salary_expectation_max', None),
            salary_negotiable=getattr(user, 'salary_negotiable', True),
            
            # Dimension 10: Work Mode
            work_mode_preference=getattr(user, 'work_mode_preference', None),
            max_commute_minutes=getattr(user, 'max_commute_minutes', None),
            
            # Dimension 11: Engagement (placeholder - would need activity tracking)
            engagement_pattern="new_user"
        )
    
    async def update_preferences(
        self, 
        user_id: int, 
        updates: PersonalizationUpdate
    ) -> PersonalizationContext:
        """
        Update user's personalization preferences.
        
        Args:
            user_id: The user's ID
            updates: Partial update with new preferences
            
        Returns:
            Updated PersonalizationContext
        """
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Apply updates
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(f"Updated personalization for user {user_id}: {list(update_data.keys())}")
        
        return await self.get_context(user_id)
    
    def _compute_verification_level(self, trust_score: int) -> str:
        """Compute verification level from trust score."""
        if trust_score >= 80:
            return "premium"
        elif trust_score >= 60:
            return "verified"
        elif trust_score >= 40:
            return "standard"
        elif trust_score >= 20:
            return "basic"
        else:
            return "unverified"


# =============================================================================
# Helper function for dependency injection
# =============================================================================

def get_personalization_service(db: AsyncSession) -> PersonalizationService:
    """Factory function for PersonalizationService."""
    return PersonalizationService(db)
