"""
Social interactions API: Follow, Connect, Star, Endorse, Rate, Watch
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.social import Follow, Connection, ProfileStar, Endorsement, Rating, ProfileWatch
from app.schemas.social import (
    FollowCreate, FollowResponse, FollowStats,
    ConnectionCreate, ConnectionUpdate, ConnectionResponse, ConnectionWithUser,
    ProfileStarCreate, ProfileStarResponse,
    ProfileWatchCreate, ProfileWatchResponse,
    EndorsementCreate, EndorsementResponse, SkillEndorsementSummary,
    RatingCreate, RatingResponse, RatingSummary,
    ProfileSocialStats,
)

router = APIRouter()


# ============ Follow Endpoints ============
@router.post("/follow", response_model=FollowResponse, status_code=status.HTTP_201_CREATED)
async def follow_user(
    data: FollowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Follow another user."""
    if data.following_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check target user exists
    target = await db.get(User, data.following_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    follow = Follow(follower_id=current_user.id, following_id=data.following_id)
    try:
        db.add(follow)
        await db.commit()
        await db.refresh(follow)
        
        # Notify Target User
        from app.services import notification_service
        await notification_service.notify_user(
            db_session=db,
            user_id=data.following_id,
            notification_type="new_follower",
            name=current_user.full_name,
            link=f"/p/{current_user.username}"
        )
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already following this user")
    
    return follow


@router.delete("/follow/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Unfollow a user."""
    result = await db.execute(
        select(Follow).where(
            and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
        )
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    await db.delete(follow)
    await db.commit()


@router.get("/followers", response_model=List[FollowResponse])
async def get_followers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of users following the current user."""
    result = await db.execute(
        select(Follow).where(Follow.following_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/following", response_model=List[FollowResponse])
async def get_following(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of users the current user is following."""
    result = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id)
    )
    return result.scalars().all()


# ============ Connection Endpoints ============
@router.post("/connections", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def request_connection(
    data: ConnectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a connection request to another user."""
    if data.addressee_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    
    # Check target user exists
    target = await db.get(User, data.addressee_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for existing connection in either direction
    result = await db.execute(
        select(Connection).where(
            or_(
                and_(Connection.requester_id == current_user.id, Connection.addressee_id == data.addressee_id),
                and_(Connection.requester_id == data.addressee_id, Connection.addressee_id == current_user.id)
            )
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"Connection already exists with status: {existing.status}")
    
    connection = Connection(
        requester_id=current_user.id,
        addressee_id=data.addressee_id,
        message=data.message
    )
    db.add(connection)
    await db.commit()
    await db.refresh(connection)
    return connection


@router.patch("/connections/{connection_id}", response_model=ConnectionResponse)
async def respond_to_connection(
    connection_id: int,
    data: ConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Accept or reject a connection request."""
    if data.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'rejected'")
    
    connection = await db.get(Connection, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection.addressee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this connection")
    
    if connection.status != "pending":
        raise HTTPException(status_code=400, detail="Connection already responded to")
    
    connection.status = data.status
    await db.commit()
    await db.refresh(connection)
    return connection


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_connection(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a connection."""
    connection = await db.get(Connection, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection.requester_id != current_user.id and connection.addressee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this connection")
    
    await db.delete(connection)
    await db.commit()


@router.get("/connections", response_model=List[ConnectionResponse])
async def get_connections(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all connections for the current user."""
    query = select(Connection).where(
        or_(
            Connection.requester_id == current_user.id,
            Connection.addressee_id == current_user.id
        )
    )
    if status_filter:
        query = query.where(Connection.status == status_filter)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/connections/pending", response_model=List[ConnectionResponse])
async def get_pending_connections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get pending connection requests received by the current user."""
    result = await db.execute(
        select(Connection).where(
            and_(
                Connection.addressee_id == current_user.id,
                Connection.status == "pending"
            )
        )
    )
    return result.scalars().all()


# ============ Profile Star Endpoints ============
@router.post("/stars", response_model=ProfileStarResponse, status_code=status.HTTP_201_CREATED)
async def star_profile(
    data: ProfileStarCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Star/bookmark a profile."""
    if data.starred_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot star yourself")
    
    target = await db.get(User, data.starred_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    star = ProfileStar(user_id=current_user.id, starred_user_id=data.starred_user_id)
    try:
        db.add(star)
        await db.commit()
        await db.refresh(star)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already starred this profile")
    
    return star


@router.delete("/stars/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unstar_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove star from a profile."""
    result = await db.execute(
        select(ProfileStar).where(
            and_(ProfileStar.user_id == current_user.id, ProfileStar.starred_user_id == user_id)
        )
    )
    star = result.scalar_one_or_none()
    if not star:
        raise HTTPException(status_code=404, detail="Profile not starred")
    
    await db.delete(star)
    await db.commit()


@router.get("/stars", response_model=List[ProfileStarResponse])
async def get_starred_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all profiles starred by the current user."""
    result = await db.execute(
        select(ProfileStar).where(ProfileStar.user_id == current_user.id)
    )
    return result.scalars().all()


# ============ Profile Watch Endpoints ============
@router.post("/watches", response_model=ProfileWatchResponse, status_code=status.HTTP_201_CREATED)
async def watch_profile(
    data: ProfileWatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Watch a profile for updates."""
    if data.watched_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot watch yourself")
    
    target = await db.get(User, data.watched_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    watch = ProfileWatch(user_id=current_user.id, watched_user_id=data.watched_user_id)
    try:
        db.add(watch)
        await db.commit()
        await db.refresh(watch)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already watching this profile")
    
    return watch


@router.delete("/watches/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unwatch_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Stop watching a profile."""
    result = await db.execute(
        select(ProfileWatch).where(
            and_(ProfileWatch.user_id == current_user.id, ProfileWatch.watched_user_id == user_id)
        )
    )
    watch = result.scalar_one_or_none()
    if not watch:
        raise HTTPException(status_code=404, detail="Profile not being watched")
    
    await db.delete(watch)
    await db.commit()


# ============ Endorsement Endpoints ============
@router.post("/endorsements", response_model=EndorsementResponse, status_code=status.HTTP_201_CREATED)
async def endorse_skill(
    data: EndorsementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Endorse a skill for another user."""
    if data.endorsed_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot endorse yourself")
    
    target = await db.get(User, data.endorsed_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Pillar 2: Weight Calculation Logic
    weight = 1.0
    is_verified_colleague = False
    
    # 1. Trust-based weight boost
    # Use sync wrapper for trust calculation as the engine is sync-based (standard Session)
    # For now, we'll access the current_user's trust_score directly from the model
    if current_user.trust_score and current_user.trust_score >= 71:
        weight += 0.5
    
    # 2. Colleague-based verification boost
    if data.experience_id:
        from app.models.experience import WorkExperience
        exp = await db.get(WorkExperience, data.experience_id)
        if exp and exp.user_id == data.endorsed_user_id:
            # Check if current_user has a verified experience at the same company
            colleague_check = await db.execute(
                select(WorkExperience).where(
                    and_(
                        WorkExperience.user_id == current_user.id,
                        WorkExperience.company == exp.company,
                        WorkExperience.is_verified == True
                    )
                )
            )
            if colleague_check.scalars().first():
                is_verified_colleague = True
                weight += 1.0

    endorsement = Endorsement(
        endorser_id=current_user.id,
        endorsed_user_id=data.endorsed_user_id,
        skill=data.skill,
        comment=data.comment,
        experience_id=data.experience_id,
        weight=weight,
        is_verified_colleague=is_verified_colleague
    )
    try:
        db.add(endorsement)
        await db.commit()
        await db.refresh(endorsement)
        
        # Notify Endorsed User (Pillar 5)
        from app.services import notification_service
        await notification_service.notify_user(
            db_session=db,
            user_id=data.endorsed_user_id,
            notification_type="post_reaction", # Re-using reaction for endorsement for now
            name=current_user.full_name,
            link="/profile"
        )
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already endorsed this skill for this user")
    
    return endorsement


@router.delete("/endorsements/{endorsement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_endorsement(
    endorsement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove an endorsement."""
    endorsement = await db.get(Endorsement, endorsement_id)
    if not endorsement:
        raise HTTPException(status_code=404, detail="Endorsement not found")
    
    if endorsement.endorser_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this endorsement")
    
    await db.delete(endorsement)
    await db.commit()


@router.get("/endorsements/received", response_model=List[EndorsementResponse])
async def get_received_endorsements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all endorsements received by the current user."""
    result = await db.execute(
        select(Endorsement).where(Endorsement.endorsed_user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/endorsements/user/{user_id}", response_model=List[EndorsementResponse])
async def get_user_endorsements(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all endorsements for a specific user."""
    result = await db.execute(
        select(Endorsement).where(Endorsement.endorsed_user_id == user_id)
    )
    return result.scalars().all()


# ============ Rating Endpoints ============
@router.post("/ratings", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def rate_user(
    data: RatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Rate another user."""
    if data.rated_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")
    
    target = await db.get(User, data.rated_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    rating = Rating(
        rater_id=current_user.id,
        rated_user_id=data.rated_user_id,
        score=data.score,
        category=data.category,
        review=data.review,
        is_anonymous=data.is_anonymous
    )
    try:
        db.add(rating)
        await db.commit()
        await db.refresh(rating)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already rated this user in this category")
    
    # Mask rater_id if anonymous
    if rating.is_anonymous:
        rating.rater_id = None
    
    return rating


@router.get("/ratings/received", response_model=List[RatingResponse])
async def get_received_ratings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all ratings received by the current user."""
    result = await db.execute(
        select(Rating).where(Rating.rated_user_id == current_user.id)
    )
    ratings = result.scalars().all()
    # Mask anonymous ratings
    for r in ratings:
        if r.is_anonymous:
            r.rater_id = None
    return ratings


@router.get("/ratings/user/{user_id}/summary", response_model=RatingSummary)
async def get_user_rating_summary(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get rating summary for a user."""
    # Get average score
    avg_result = await db.execute(
        select(func.avg(Rating.score), func.count(Rating.id))
        .where(Rating.rated_user_id == user_id)
    )
    avg_row = avg_result.one()
    avg_score = float(avg_row[0]) if avg_row[0] else 0.0
    total = avg_row[1] or 0
    
    # Get category averages
    cat_result = await db.execute(
        select(Rating.category, func.avg(Rating.score))
        .where(Rating.rated_user_id == user_id)
        .group_by(Rating.category)
    )
    category_scores = {row[0]: float(row[1]) for row in cat_result.all()}
    
    return RatingSummary(
        average_score=round(avg_score, 2),
        total_ratings=total,
        category_scores=category_scores
    )


# ============ Profile Social Stats ============
@router.get("/stats/{user_id}", response_model=ProfileSocialStats)
async def get_profile_social_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get complete social stats for a user profile."""
    # Check user exists
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Followers count
    followers_result = await db.execute(
        select(func.count(Follow.id)).where(Follow.following_id == user_id)
    )
    followers_count = followers_result.scalar() or 0
    
    # Following count
    following_result = await db.execute(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    )
    following_count = following_result.scalar() or 0
    
    # Connections count (accepted only)
    connections_result = await db.execute(
        select(func.count(Connection.id)).where(
            and_(
                or_(Connection.requester_id == user_id, Connection.addressee_id == user_id),
                Connection.status == "accepted"
            )
        )
    )
    connections_count = connections_result.scalar() or 0
    
    # Stars count
    stars_result = await db.execute(
        select(func.count(ProfileStar.id)).where(ProfileStar.starred_user_id == user_id)
    )
    stars_count = stars_result.scalar() or 0
    
    # Endorsements count
    endorsements_result = await db.execute(
        select(func.count(Endorsement.id)).where(Endorsement.endorsed_user_id == user_id)
    )
    endorsements_count = endorsements_result.scalar() or 0
    
    # Ratings stats
    ratings_result = await db.execute(
        select(func.count(Rating.id), func.avg(Rating.score))
        .where(Rating.rated_user_id == user_id)
    )
    ratings_row = ratings_result.one()
    ratings_count = ratings_row[0] or 0
    average_rating = round(float(ratings_row[1]), 2) if ratings_row[1] else None
    
    # Current user's relationship with this profile
    is_following = False
    is_connected = False
    is_starred = False
    is_watching = False
    connection_status = None
    
    if current_user.id != user_id:
        # Check following
        follow_check = await db.execute(
            select(Follow).where(
                and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
            )
        )
        is_following = follow_check.scalar_one_or_none() is not None
        
        # Check connection
        conn_check = await db.execute(
            select(Connection).where(
                or_(
                    and_(Connection.requester_id == current_user.id, Connection.addressee_id == user_id),
                    and_(Connection.requester_id == user_id, Connection.addressee_id == current_user.id)
                )
            )
        )
        connection = conn_check.scalar_one_or_none()
        if connection:
            connection_status = connection.status
            is_connected = connection.status == "accepted"
        
        # Check starred
        star_check = await db.execute(
            select(ProfileStar).where(
                and_(ProfileStar.user_id == current_user.id, ProfileStar.starred_user_id == user_id)
            )
        )
        is_starred = star_check.scalar_one_or_none() is not None
        
        # Check watching
        watch_check = await db.execute(
            select(ProfileWatch).where(
                and_(ProfileWatch.user_id == current_user.id, ProfileWatch.watched_user_id == user_id)
            )
        )
        is_watching = watch_check.scalar_one_or_none() is not None
    
    return ProfileSocialStats(
        followers_count=followers_count,
        following_count=following_count,
        connections_count=connections_count,
        stars_count=stars_count,
        endorsements_count=endorsements_count,
        ratings_count=ratings_count,
        average_rating=average_rating,
        is_following=is_following,
        is_connected=is_connected,
        is_starred=is_starred,
        is_watching=is_watching,
        connection_status=connection_status
    )
