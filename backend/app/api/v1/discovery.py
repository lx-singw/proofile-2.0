"""
Discovery API: Find and explore professional profiles
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
import json

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.profile import Profile
from app.models.social import Follow, ProfileStar, Rating, Endorsement
from pydantic import BaseModel, Field

router = APIRouter()


class DiscoveryProfile(BaseModel):
    """Profile data for discovery results."""
    id: int
    username: Optional[str]
    full_name: Optional[str]
    headline: Optional[str]
    avatar_url: Optional[str]
    industry: Optional[str]
    experience_level: Optional[str]
    skills: List[str]
    followers_count: int
    stars_count: int
    average_rating: Optional[float]
    endorsements_count: int
    is_verified: bool
    is_following: bool
    is_starred: bool


class DiscoveryResponse(BaseModel):
    """Response for discovery endpoints."""
    profiles: List[DiscoveryProfile]
    total: int
    page: int
    page_size: int


async def build_discovery_profile(
    db: AsyncSession,
    user: User,
    profile: Optional[Profile],
    current_user_id: int
) -> DiscoveryProfile:
    """Build a discovery profile with stats."""
    # Get followers count
    followers_result = await db.execute(
        select(func.count(Follow.id)).where(Follow.following_id == user.id)
    )
    followers_count = followers_result.scalar() or 0
    
    # Get stars count
    stars_result = await db.execute(
        select(func.count(ProfileStar.id)).where(ProfileStar.starred_user_id == user.id)
    )
    stars_count = stars_result.scalar() or 0
    
    # Get average rating
    rating_result = await db.execute(
        select(func.avg(Rating.score)).where(Rating.rated_user_id == user.id)
    )
    avg_rating = rating_result.scalar()
    average_rating = round(float(avg_rating), 2) if avg_rating else None
    
    # Get endorsements count
    endorsements_result = await db.execute(
        select(func.count(Endorsement.id)).where(Endorsement.endorsed_user_id == user.id)
    )
    endorsements_count = endorsements_result.scalar() or 0
    
    # Check if current user is following
    is_following = False
    is_starred = False
    if current_user_id != user.id:
        follow_check = await db.execute(
            select(Follow).where(
                and_(Follow.follower_id == current_user_id, Follow.following_id == user.id)
            )
        )
        is_following = follow_check.scalar_one_or_none() is not None
        
        star_check = await db.execute(
            select(ProfileStar).where(
                and_(ProfileStar.user_id == current_user_id, ProfileStar.starred_user_id == user.id)
            )
        )
        is_starred = star_check.scalar_one_or_none() is not None
    
    # Parse skills
    skills = []
    if user.skills:
        try:
            skills = json.loads(user.skills)
        except (json.JSONDecodeError, TypeError):
            pass
    
    return DiscoveryProfile(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        headline=profile.headline if profile else None,
        avatar_url=user.profile_photo_url or (profile.avatar_url if profile else None),
        industry=user.industry,
        experience_level=user.experience_level,
        skills=skills[:5] if skills else [],  # Top 5 skills
        followers_count=followers_count,
        stars_count=stars_count,
        average_rating=average_rating,
        endorsements_count=endorsements_count,
        is_verified=user.profile_visibility == "verified",  # Simplified
        is_following=is_following,
        is_starred=is_starred
    )


@router.get("/trending", response_model=DiscoveryResponse)
async def get_trending_profiles(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    industry: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get trending profiles (most followed + starred recently)."""
    # Build query - users with most followers + stars
    query = (
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(
            and_(
                User.is_active == True,
                User.id != current_user.id,
                User.profile_visibility == "public"
            )
        )
    )
    
    if industry:
        query = query.where(User.industry == industry)
    
    # For now, order by created_at desc (in production, use a scoring algorithm)
    query = query.order_by(desc(User.created_at))
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    profiles = []
    for user, profile in rows:
        discovery_profile = await build_discovery_profile(db, user, profile, current_user.id)
        profiles.append(discovery_profile)
    
    return DiscoveryResponse(
        profiles=profiles,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/rising", response_model=DiscoveryResponse)
async def get_rising_talent(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    experience_level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get rising talent - newer users with good engagement."""
    query = (
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(
            and_(
                User.is_active == True,
                User.id != current_user.id,
                User.profile_visibility == "public"
            )
        )
    )
    
    if experience_level:
        query = query.where(User.experience_level == experience_level)
    
    # Order by newest first
    query = query.order_by(desc(User.created_at))
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    profiles = []
    for user, profile in rows:
        discovery_profile = await build_discovery_profile(db, user, profile, current_user.id)
        profiles.append(discovery_profile)
    
    return DiscoveryResponse(
        profiles=profiles,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/top-rated", response_model=DiscoveryResponse)
async def get_top_rated_profiles(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    industry: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get top-rated profiles by average rating."""
    # Get users with ratings, ordered by average rating
    subquery = (
        select(
            Rating.rated_user_id,
            func.avg(Rating.score).label("avg_rating"),
            func.count(Rating.id).label("rating_count")
        )
        .group_by(Rating.rated_user_id)
        .having(func.count(Rating.id) >= 1)  # At least 1 rating
        .subquery()
    )
    
    query = (
        select(User, Profile, subquery.c.avg_rating)
        .join(subquery, User.id == subquery.c.rated_user_id)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(
            and_(
                User.is_active == True,
                User.id != current_user.id,
                User.profile_visibility == "public"
            )
        )
    )
    
    if industry:
        query = query.where(User.industry == industry)
    
    query = query.order_by(desc(subquery.c.avg_rating))
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    profiles = []
    for user, profile, avg_rating in rows:
        discovery_profile = await build_discovery_profile(db, user, profile, current_user.id)
        profiles.append(discovery_profile)
    
    return DiscoveryResponse(
        profiles=profiles,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/search", response_model=DiscoveryResponse)
async def search_profiles(
    q: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    industry: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search profiles by name, headline, or skills."""
    search_term = f"%{q.lower()}%"
    
    query = (
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(
            and_(
                User.is_active == True,
                User.id != current_user.id,
                User.profile_visibility == "public",
                or_(
                    func.lower(User.full_name).like(search_term),
                    func.lower(User.username).like(search_term),
                    func.lower(Profile.headline).like(search_term),
                    func.lower(User.skills).like(search_term),
                    func.lower(User.industry).like(search_term)
                )
            )
        )
    )
    
    if industry:
        query = query.where(User.industry == industry)
    if experience_level:
        query = query.where(User.experience_level == experience_level)
    
    query = query.order_by(User.full_name)
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    profiles = []
    for user, profile in rows:
        discovery_profile = await build_discovery_profile(db, user, profile, current_user.id)
        profiles.append(discovery_profile)
    
    return DiscoveryResponse(
        profiles=profiles,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/by-industry/{industry}", response_model=DiscoveryResponse)
async def get_profiles_by_industry(
    industry: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get profiles in a specific industry."""
    query = (
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(
            and_(
                User.is_active == True,
                User.id != current_user.id,
                User.profile_visibility == "public",
                func.lower(User.industry) == industry.lower()
            )
        )
        .order_by(desc(User.created_at))
    )
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    profiles = []
    for user, profile in rows:
        discovery_profile = await build_discovery_profile(db, user, profile, current_user.id)
        profiles.append(discovery_profile)
    
    return DiscoveryResponse(
        profiles=profiles,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/industries", response_model=List[dict])
async def get_available_industries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of industries with profile counts."""
    result = await db.execute(
        select(User.industry, func.count(User.id).label("count"))
        .where(
            and_(
                User.is_active == True,
                User.industry.isnot(None),
                User.profile_visibility == "public"
            )
        )
        .group_by(User.industry)
        .order_by(desc("count"))
    )
    
    industries = []
    for industry, count in result.all():
        if industry:
            industries.append({"industry": industry, "count": count})
    
    return industries
