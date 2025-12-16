"""
Personalization API Endpoints

Provides endpoints for retrieving and updating user personalization preferences.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.services.personalization_service import (
    PersonalizationService,
    PersonalizationContext,
    PersonalizationUpdate,
    get_personalization_service
)

router = APIRouter()


@router.get("/context", response_model=PersonalizationContext)
async def get_personalization_context(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get the complete personalization context for the current user.
    
    Returns all 11 personalization dimensions:
    - Opportunity Category
    - Persona
    - Industry
    - Experience Level
    - Location/Province
    - Career Intent
    - Verification Level
    - Skills
    - Salary Expectations
    - Work Mode
    - Engagement Pattern
    """
    service = get_personalization_service(db)
    return await service.get_context(current_user.id)


@router.patch("/preferences", response_model=PersonalizationContext)
async def update_personalization_preferences(
    updates: PersonalizationUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update the current user's personalization preferences.
    
    Accepts partial updates for:
    - Location: province, city, willing_to_relocate
    - Career: career_intent, available_from, notice_period_weeks
    - Salary: salary_expectation_min/max, salary_negotiable
    - Work Mode: work_mode_preference, max_commute_minutes
    - Experience: years_experience
    """
    service = get_personalization_service(db)
    try:
        return await service.update_preferences(current_user.id, updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/dimensions")
async def get_dimension_options():
    """
    Get available options for each personalization dimension.
    
    Returns dropdown/select options for UI forms.
    """
    return {
        "provinces": [
            {"value": "gauteng", "label": "Gauteng"},
            {"value": "western_cape", "label": "Western Cape"},
            {"value": "kwazulu_natal", "label": "KwaZulu-Natal"},
            {"value": "eastern_cape", "label": "Eastern Cape"},
            {"value": "limpopo", "label": "Limpopo"},
            {"value": "mpumalanga", "label": "Mpumalanga"},
            {"value": "free_state", "label": "Free State"},
            {"value": "north_west", "label": "North West"},
            {"value": "northern_cape", "label": "Northern Cape"},
        ],
        "career_intents": [
            {"value": "actively_looking", "label": "Actively Looking"},
            {"value": "passively_open", "label": "Open to Opportunities"},
            {"value": "career_changer", "label": "Changing Careers"},
            {"value": "upskilling", "label": "Upskilling"},
            {"value": "returning_to_work", "label": "Returning to Work"},
            {"value": "exploring_options", "label": "Exploring Options"},
        ],
        "work_modes": [
            {"value": "remote_only", "label": "Remote Only"},
            {"value": "hybrid", "label": "Hybrid"},
            {"value": "office_based", "label": "Office Based"},
            {"value": "field_work", "label": "Field Work"},
            {"value": "flexible", "label": "Flexible"},
        ],
        "experience_levels": [
            {"value": "entry_student", "label": "Entry Level / Student"},
            {"value": "junior", "label": "Junior (0-2 years)"},
            {"value": "mid_level", "label": "Mid-Level (3-5 years)"},
            {"value": "senior", "label": "Senior (5-10 years)"},
            {"value": "executive", "label": "Executive (10+ years)"},
        ],
        "salary_ranges": [
            {"value": [0, 150000], "label": "R0 - R150k (Entry)"},
            {"value": [150000, 350000], "label": "R150k - R350k (Junior)"},
            {"value": [350000, 600000], "label": "R350k - R600k (Mid)"},
            {"value": [600000, 1000000], "label": "R600k - R1M (Senior)"},
            {"value": [1000000, 2000000], "label": "R1M - R2M (Executive)"},
            {"value": [2000000, None], "label": "R2M+ (C-Suite)"},
        ],
    }
