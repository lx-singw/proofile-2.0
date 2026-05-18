from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pathlib import Path
from sqlalchemy import select

from app.core.file_upload import (
    validate_file_size,
    validate_file_extension,
    validate_file_content,
    save_upload_file
)

from app.api import deps
from app.models.user import User
from app.models.profile import Profile
from app.services import profile_service, profile_cache
from app.models.user import UserRole
from app.schemas.profile import ProfileRead, ProfileCreate, ProfileUpdate
from app.services.profile_builder import UniversalProfileBuilder, DataSourceType

router = APIRouter(redirect_slashes=False)

# Standard error messages
PROFILE_NOT_FOUND = "Profile not found"

@router.post("/ingest", response_model=ProfileRead)
async def ingest_profile_data(
    data: dict,
    source: str = "manual",
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Ingest data into the user's profile from an external source.
    """
    builder = UniversalProfileBuilder(db)
    # Convert string source to enum if possible
    try:
        source_enum = DataSourceType(source)
    except ValueError:
        source_enum = DataSourceType.MANUAL_ENTRY

    profile = await builder.ingest_data(
        user_id=current_user.id,
        source=source_enum,
        data=data,
        confidence=1.0 # Manual/API ingestion is high confidence
    )
    
    # Update cache
    profile_read = ProfileRead.model_validate(profile)
    await profile_cache.set_profile(profile_read)
    
    return profile_read

@router.get("/", response_model=list[ProfileRead])
@router.get("", response_model=list[ProfileRead], include_in_schema=False)
async def list_profiles(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    List profiles with pagination.
    """
    cached = await profile_cache.get_profile_list(skip, limit)
    if cached is not None:
        return cached

    rows = await db.execute(
        select(
            Profile.id,
            Profile.user_id,
            Profile.headline,
            Profile.summary,
            Profile.avatar_url,
        )
        .offset(skip)
        .limit(limit)
        .order_by(Profile.id)
    )
    profile_payload = [dict(row) for row in rows.mappings().all()]
    await profile_cache.set_profile_list(skip, limit, profile_payload)
    return profile_payload

@router.get("/me", response_model=ProfileRead)
async def get_my_profile(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Get the profile of the current authenticated user.
    If no profile exists, automatically create one using onboarding data.
    """
    import logging
    import json
    logger = logging.getLogger(__name__)
    
    try:
        profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
        
        # Auto-create profile if not found
        if profile is None:
            logger.info(f"Auto-creating profile for user {current_user.id}")
            
            # Safe attribute access for CachedUser objects
            user_persona = getattr(current_user, 'persona', None)
            user_industry = getattr(current_user, 'industry', None)
            user_skills = getattr(current_user, 'skills', None)
            user_primary_goal = getattr(current_user, 'primary_goal', None)
            
            # Build headline from persona and experience
            headline_parts = []
            if user_persona:
                persona_labels = {
                    "job_seeker": "Professional",
                    "freelancer": "Freelance Professional",
                    "recruiter": "Talent Acquisition Specialist",
                    "employer": "Hiring Manager",
                    "career_changer": "Career Transition Professional",
                    "student": "Aspiring Professional"
                }
                headline_parts.append(persona_labels.get(user_persona, "Professional"))
            if user_industry:
                headline_parts.append(f"in {user_industry}")
            
            headline = " ".join(headline_parts) if headline_parts else "Building my professional profile"
            
            # Parse skills if available
            skills_list = []
            if user_skills:
                try:
                    skills_list = json.loads(user_skills) if isinstance(user_skills, str) else user_skills
                except:
                    skills_list = []
            
            # Build summary from primary goal
            summary = ""
            if user_primary_goal:
                goal_texts = {
                    "find_job": "Actively seeking new opportunities to grow my career.",
                    "find_clients": "Looking to connect with clients and expand my freelance network.",
                    "hire_talent": "Focused on finding and recruiting top talent.",
                    "build_network": "Building professional connections in my industry.",
                    "learn_skills": "Continuously learning and developing new skills."
                }
                summary = goal_texts.get(user_primary_goal, "")
            
            # Create the profile with onboarding data
            try:
                profile_data = ProfileCreate(
                    headline=headline,
                    summary=summary,
                    skills_data=skills_list,
                    experience_data=[],
                    education_data=[],
                    completeness_data={"overall": 30, "trust": 10},
                    state="embryo"
                )
            
                profile = await profile_service.create_profile(
                    db=db, profile_in=profile_data, user_id=current_user.id
                )
                logger.info(f"Auto-created profile {profile.id} for user {current_user.id}")
                
            except Exception as creation_err:
                # Log detailed error if creation fails
                logger.exception("Failed to auto-create profile: %s", creation_err)
                # If it was a validation error, it will be logged clearly now.
                # Fallback: check if profile exists one last time (race condition?)
                profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
                if profile is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create profile: {str(creation_err)}"
                    )

        if profile is None:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Profile creation failed silently"
            )
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in get_my_profile: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{profile_id}", response_model=ProfileRead)
async def get_profile(
    profile_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Get a specific profile by its ID.
    Access is restricted to owners, admins, and employers.
    """
    cached_profile = await profile_cache.get_profile(profile_id)

    if current_user.role not in [UserRole.ADMIN, UserRole.EMPLOYER]:
        if cached_profile and getattr(cached_profile, "user_id", None) == current_user.id:
            return cached_profile

        user_profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
        if not user_profile:
            last_known_id = await profile_cache.get_last_known_profile_id(current_user.id)
            if last_known_id == profile_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=PROFILE_NOT_FOUND
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this profile"
            )
        if user_profile.id != profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this profile"
            )
        profile_read = ProfileRead.model_validate(user_profile)
        await profile_cache.set_profile(profile_read)
        return profile_read

    # Fetch the profile once at the beginning
    if cached_profile:
        return cached_profile

    profile = await profile_service.get_profile(db, id=profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    profile_read = ProfileRead.model_validate(profile)
    await profile_cache.set_profile(profile_read)
    return profile_read


@router.post("/", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Create a new profile for the current authenticated user.
    This endpoint replaces the one previously in users.py.
    """
    existing_profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A profile for this user already exists."
        )

    try:
        new_profile = await profile_service.create_profile(
            db=db, profile_in=profile_data, user_id=current_user.id
        )
        profile_read = ProfileRead.model_validate(new_profile)
        await profile_cache.set_profile(profile_read)
        return profile_read
    except IntegrityError: # Should be rare now, but good as a safeguard.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the profile."
        )


@router.patch("/{profile_id}", response_model=ProfileRead)
async def update_profile(
    profile_id: int,
    profile_update: ProfileUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Update a profile's information.
    """
    profile = await profile_service.get_profile(db, id=profile_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this profile"
        )

    # Get the update data, excluding fields that were not set in the request
    update_data = profile_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updated_profile = await profile_service.update_profile(db=db, profile=profile, profile_in=profile_update)
    if updated_profile:
        profile_read = ProfileRead.model_validate(updated_profile)
        await profile_cache.set_profile(profile_read)
        return profile_read
    await profile_cache.invalidate_profile(profile_id)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Profile not found"
    )


@router.post("/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """Upload a profile avatar."""
    # Get user's profile first
    profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Security validations
    validate_file_size(file)
    validate_file_extension(file.filename)
    await validate_file_content(file)

    # Prepare file path - in production this would be cloud storage
    # For now, store in a local uploads directory
    uploads_dir = Path("uploads/avatars")
    
    # Sanitize filename to prevent path traversal attacks
    if not file.filename or ".." in file.filename or "/" in file.filename or "\\" in file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    file_ext = Path(file.filename).suffix
    unique_filename = f"user_{current_user.id}_avatar{file_ext}"
    file_path = uploads_dir / unique_filename

    try:
        # Save the file
        await save_upload_file(file, file_path)

        # Update profile with avatar URL
        avatar_url = f"/avatars/{unique_filename}"  # URL path, not filesystem path
        profile.avatar_url = avatar_url
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        profile_read = ProfileRead.model_validate(profile)
        await profile_cache.set_profile(profile_read)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Avatar uploaded successfully",
                "avatar_url": avatar_url,
            },
        )
        
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Delete a profile.
    """
    profile = await profile_service.get_profile(db, id=profile_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this profile"
        )

    try:
        await profile_service.delete_profile(db=db, profile=profile)
        await profile_cache.invalidate_profile(profile_id)
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        ) from e


# === Public Profile Endpoints ===

from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class PublicProfileResponse(BaseModel):
    username: str
    full_name: Optional[str]
    bio: Optional[str]
    profile_photo_url: Optional[str]
    persona: Optional[str]
    industry: Optional[str]
    experiences: List[dict]
    portfolio: List[dict]
    skills_data: List[str] = [] # Added for Pillar 2
    user_id: int
    is_private: bool = False  # True if profile is private (only visible to owner)
    
    model_config = ConfigDict(from_attributes=True)


class UsernameCheckResponse(BaseModel):
    available: bool
    suggestion: Optional[str] = None


@router.get("/public/{username}", response_model=None)
async def get_public_profile(
    username: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user_optional)
):
    """
    Get a user's public profile by username.
    Returns the full public profile with verified reviews, Proofile Score, and skills.
    Returns 404 if user doesn't exist or profile is private.
    """
    from app.models.verified_review import VerifiedReview, ReviewStatus
    from app.services.proofile_score import get_score_breakdown
    from collections import Counter

    # Find user by username
    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Check if profile is private
    is_private = user.profile_visibility != "public"

    # If private, only owner can view
    if is_private:
        current_user_id = getattr(current_user, 'id', None) if current_user else None
        if current_user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

    # Get all published reviews for this user
    reviews_result = await db.execute(
        select(VerifiedReview).where(
            VerifiedReview.reviewee_id == user.id,
            VerifiedReview.status == ReviewStatus.PUBLISHED.value,
            VerifiedReview.is_flagged == False,
        ).order_by(VerifiedReview.completed_at.desc())
    )
    all_reviews = reviews_result.scalars().all()

    # Group reviews by work experience
    reviews_by_exp = {}
    for review in all_reviews:
        exp_id = str(review.work_experience_id)
        if exp_id not in reviews_by_exp:
            reviews_by_exp[exp_id] = []
        reviews_by_exp[exp_id].append(review.to_public_dict())

    # Build experiences with nested reviews
    experiences = []
    for exp in user.work_experiences:
        exp_dict = exp.to_dict()
        exp_dict["reviews"] = reviews_by_exp.get(str(exp.id), [])
        exp_dict["review_count"] = len(exp_dict["reviews"])
        experiences.append(exp_dict)

    # Build verified skills with endorsement counts
    skill_endorsements = Counter()
    for review in all_reviews:
        for skill in (review.endorsed_skills or []):
            skill_endorsements[skill] += 1

    # Get score breakdown
    score_breakdown = await get_score_breakdown(db, user.id)

    # Compute summary stats
    total_reviews = len(all_reviews)
    avg_rating = 0.0
    if total_reviews > 0:
        avg_rating = round(
            sum(r.star_rating for r in all_reviews if r.star_rating) / total_reviews,
            2
        )

    # Get profile headline
    headline = None
    skills_data = []
    if user.profile:
        headline = user.profile.headline
        skills_data = user.profile.skills_data or []

    return {
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "profile_photo_url": user.profile_photo_url,
        "headline": headline,
        "persona": user.persona,
        "industry": user.industry,
        "city": user.city,
        "github_url": None,  # TODO: Pull from profile data sources
        "linkedin_url": None,  # TODO: Pull from profile data sources
        "user_id": user.id,
        "is_private": is_private,
        "experiences": experiences,
        "skills_data": skills_data,
        "verified_skills": dict(skill_endorsements),
        "proofile_score": user.trust_score or 0,
        "score_breakdown": score_breakdown,
        "total_reviews": total_reviews,
        "avg_rating": avg_rating,
        "portfolio": [item.to_dict() for item in user.portfolio_items],
    }


@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username_availability(
    username: str,
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Check if a username is available.
    Optionally returns a suggestion if taken.
    """
    # Validate username format (lowercase alphanumeric and hyphens only)
    import re
    if not re.match(r'^[a-z0-9-]+$', username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain lowercase letters, numbers, and hyphens"
        )
    
    if len(username) < 3 or len(username) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 30 characters"
        )
    
    # Check if username exists
    result = await db.execute(
        select(User).where(User.username == username)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        # Generate suggestion by appending a random number
        import random
        suggestion = f"{username}{random.randint(10, 99)}"
        return UsernameCheckResponse(available=False, suggestion=suggestion)
    
    return UsernameCheckResponse(available=True)