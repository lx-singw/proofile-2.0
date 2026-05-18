"""
API Endpoints for Users.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.models.user import User
from app import schemas
from app.services import user_service, profile_service
from app.models.user import UserRole
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError


router = APIRouter()


def _is_admin(role) -> bool:
    if isinstance(role, UserRole):
        return role == UserRole.ADMIN
    if isinstance(role, str):
        return role.lower() == UserRole.ADMIN.value
    return False


@router.post("", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_in: schemas.UserCreate, db: AsyncSession = Depends(deps.get_db)
):
    """
    Create a new user.
    """
    try:
        user_data = user_in.model_dump()
        user_data.pop("role", None)
        sanitized = schemas.UserCreate(**user_data)
        user = await user_service.create_user(db=db, user_in=sanitized)
        return user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logging.getLogger(__name__).exception("User creation failed: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed. Please try again.",
        )

@router.get("/me", response_model=schemas.UserRead)
async def read_current_user(current_user = Depends(deps.get_current_active_user)):
    """Return the currently authenticated user's details.

    This provides a stable /api/v1/users/me endpoint for frontend authService probes.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "role": current_user.role,
        "persona": current_user.persona,
        "experience_level": current_user.experience_level,
        "primary_goal": current_user.primary_goal,
        "industry": current_user.industry,
        "opportunity_preference": current_user.opportunity_preference,
        "years_experience": current_user.years_experience,
        "province": current_user.province,
        "city": current_user.city,
        "willing_to_relocate": current_user.willing_to_relocate,
        "career_intent": current_user.career_intent,
        "available_from": current_user.available_from,
        "notice_period_weeks": current_user.notice_period_weeks,
        "salary_expectation_min": current_user.salary_expectation_min,
        "salary_expectation_max": current_user.salary_expectation_max,
        "salary_negotiable": current_user.salary_negotiable,
        "work_mode_preference": current_user.work_mode_preference,
        "max_commute_minutes": current_user.max_commute_minutes,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }

@router.patch("/me", response_model=schemas.UserRead)
async def update_current_user(
    user_in: schemas.UserUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update the current user's own information.
    Users can update their own persona, full_name, etc.
    """
    try:
        # Fetch the actual User object from the database
        # (current_user from deps is a CachedUser, not a mapped SQLAlchemy object)
        result = await db.execute(select(User).where(User.id == current_user.id))
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger = logging.getLogger(__name__)
        logger.debug("Updating user %s with data: %s", db_user.id, user_in.model_dump(exclude_unset=True))
        updated_user = await user_service.update_user(db, user=db_user, user_in=user_in)
        logger.debug("User updated successfully: %s", updated_user.id)
        return updated_user
    except HTTPException:
        raise
    except IntegrityError as e:
        # Handle duplicate username or other unique constraint violations
        await db.rollback()
        error_str = str(e).lower()
        if "username" in error_str or "ix_users_username" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken. Please choose a different username."
            ) from e
        # Generic integrity error
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This value is already in use. Please try a different one."
        ) from e
    except Exception as e:
        logging.getLogger(__name__).exception("User self-update failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        ) from e


@router.patch("/{user_id}", response_model=schemas.UserRead)
async def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update a user's details. Only accessible by admins.
    """
    if not _is_admin(getattr(current_user, "role", None)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )

    user = await user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    try:
        updated_user = await user_service.update_user(db, user=user, user_in=user_in)
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        ) from e


@router.get("/me/stats")
async def get_user_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get dashboard statistics for the current user.
    Returns counts for verifications, ratings, etc.
    """
    from app.models.verification import Verification
    from app.models.rating_request import RatingRequest
    from app.models.saved_opportunity import SavedOpportunity as SavedJob
    from sqlalchemy import func
    
    try:
        # Count verifications (completed/verified)
        verification_count_result = await db.execute(
            select(func.count(Verification.id))
            .where(Verification.user_id == current_user.id)
            .where(Verification.status == "verified")
        )
        verification_count = verification_count_result.scalar() or 0
        
        # Count completed rating requests (incoming)
        rating_count_result = await db.execute(
            select(func.count(RatingRequest.id))
            .where(RatingRequest.receiver_id == current_user.id)
            .where(RatingRequest.status == "completed")
        )
        rating_count = rating_count_result.scalar() or 0
        
        # Count saved jobs
        saved_jobs_count_result = await db.execute(
            select(func.count(SavedJob.id)).where(SavedJob.user_id == current_user.id)
        )
        saved_jobs_count = saved_jobs_count_result.scalar() or 0
        
        return {
            "resumes_count": 0,  # Resume functionality has been removed
            "verifications_count": verification_count,
            "ratings_count": rating_count,
            "saved_jobs_count": saved_jobs_count,
        }
    except Exception as e:
        logging.getLogger(__name__).exception("Failed to get user stats: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        ) from e


@router.put("/me/preferences")
async def update_preferences(
    preferences: dict,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update dashboard preferences for the current user.
    """
    import json
    try:
        # Fetch the actual User object from the database
        # (current_user from deps is a CachedUser, not a mapped SQLAlchemy object)
        result = await db.execute(select(User).where(User.id == current_user.id))
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user preferences
        db_user.dashboard_preferences = json.dumps(preferences)
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return {"status": "success", "preferences": preferences}
    except HTTPException:
        raise
    except Exception as e:
        logging.getLogger(__name__).exception("Failed to update preferences: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        ) from e

@router.get("/me/preferences")
async def get_preferences(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get dashboard preferences for the current user.
    """
    import json
    try:
        # Fetch the actual User object from the database
        # (current_user from deps is a CachedUser, not a mapped SQLAlchemy object)
        result = await db.execute(select(User).where(User.id == current_user.id))
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not db_user.dashboard_preferences:
            return {}
        return json.loads(db_user.dashboard_preferences)
    except HTTPException:
        raise
    except Exception as e:
        logging.getLogger(__name__).exception("Failed to get preferences: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get preferences"
        ) from e