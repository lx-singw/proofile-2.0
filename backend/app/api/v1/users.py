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

async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
):
    """
    Create a new user.
    """
    try:
        # Sanitize incoming data: do not allow clients to set the role at registration.
        user_data = user_in.model_dump()
        user_data.pop("role", None)
        sanitized = schemas.UserCreate(**user_data)
        
        user = await user_service.create_user(db=db, user_in=sanitized)
        return user
    except IntegrityError:
        # This will be caught if the email already exists due to the unique constraint.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

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
        # Return full traceback in response temporarily for debugging
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DEBUG: {repr(e)}\n{tb}",
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
        "role": current_user.role,
        "persona": current_user.persona,
        "experience_level": current_user.experience_level,
        "primary_goal": current_user.primary_goal,
        "industry": current_user.industry,
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
        
        print(f"[DEBUG] Updating user {db_user.id} with data: {user_in.model_dump(exclude_unset=True)}")
        updated_user = await user_service.update_user(db, user=db_user, user_in=user_in)
        print(f"[DEBUG] User updated successfully: {updated_user.id}")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"User self-update failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
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
    Returns counts for resumes, verifications, ratings, etc.
    """
    from app.models.resume import Resume
    from sqlalchemy import func
    
    try:
        # Count resumes
        resume_count_result = await db.execute(
            select(func.count(Resume.id)).where(Resume.user_id == current_user.id)
        )
        resume_count = resume_count_result.scalar() or 0
        
        # TODO: Add counts for verifications and ratings when those models exist
        # For now, return 0 for those
        verification_count = 0
        rating_count = 0
        saved_jobs_count = 0
        
        return {
            "resumes_count": resume_count,
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