"""
API Endpoints for Ratings with Anti-Gaming Measures

Endpoints:
- POST /api/v1/ratings - Create a new rating
- GET /api/v1/users/{user_id}/ratings - Get ratings for a user
- GET /api/v1/ratings/{rating_id} - Get a specific rating
- PUT /api/v1/ratings/{rating_id} - Update a rating (within annual limit)
- DELETE /api/v1/ratings/{rating_id} - Delete a rating (own ratings only)
- POST /api/v1/ratings/{rating_id}/flag - Flag a rating for review (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.social import Rating
from app.services.anti_gaming import AntiGamingMeasures

router = APIRouter(prefix="/ratings", tags=["ratings"])
logger = logging.getLogger(__name__)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_rating(
    rated_user_id: int = Query(...),
    score: int = Query(..., ge=1, le=5),
    category: str = Query(...),
    relationship_type: str = Query("colleague", description="colleague, manager, direct_report, client"),
    review: str = Query("", max_length=1000),
    company: str = Query(""),
    is_anonymous: bool = Query(False),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Create a new professional rating with enhanced anti-gaming validation.
    
    Anti-Gaming Measures Applied:
    1. Duplicate Detection - One rating per person per company per year
    2. Rate Limiting - Maximum 5 ratings per 24 hours
    3. Suspicious Pattern Detection - Auto-flag all 5-star patterns
    4. Weighted Scoring - Manager=10pts, Client=7pts, Colleague=5pts
    5. Employment Verification - Cross-reference with verified employment
    6. Reciprocal Notifications - Notify rated user to rate back
    
    Returns: Rating object with anti-gaming metadata
    """
    from app.services.anti_gaming import (
        validate_rating_with_all_checks, 
        RELATIONSHIP_WEIGHTS,
        AntiGamingMeasures
    )
    
    # Validate user is not rating themselves
    if rated_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot rate yourself"
        )
    
    # Check that rated user exists
    rated_user_result = await session.execute(
        select(User).where(User.id == rated_user_id)
    )
    rated_user = rated_user_result.scalars().first()
    if not rated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {rated_user_id} not found"
        )
    
    # Run comprehensive anti-gaming validation
    is_valid, errors, metadata = await validate_rating_with_all_checks(
        session=session,
        rater_id=current_user.id,
        rated_user_id=rated_user_id,
        company=company,
        relationship_type=relationship_type,
        score=score
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors)
        )
    
    # Get weight for relationship type
    weight = RELATIONSHIP_WEIGHTS.get(relationship_type, 5)
    
    # Create rating object
    rating = Rating(
        rater_id=current_user.id,
        rated_user_id=rated_user_id,
        rater_name=current_user.full_name if not is_anonymous else None,
        score=score,
        category=category,
        review=review,
        company=company,
        relationship_type=relationship_type,
        is_anonymous=is_anonymous,
    )
    
    # Run suspicious pattern detection
    is_suspicious, flag_reason = await AntiGamingMeasures.detect_suspicious_patterns(
        session, rated_user_id
    )
    
    if is_suspicious:
        rating.is_flagged = True
        rating.flag_reason = flag_reason
        logger.warning(f"Rating flagged: {flag_reason}")
    
    session.add(rating)
    await session.flush()
    
    # Create reciprocal rating notification if not mutual yet
    if not metadata.get("mutual_confirmed"):
        try:
            await AntiGamingMeasures.create_reciprocal_notification(
                session,
                rating.id,
                rated_user_id,
                current_user.full_name or "A professional"
            )
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
    
    await session.commit()
    
    logger.info(f"Rating created: {current_user.id} rated {rated_user_id} (weight={weight})")
    
    # Return enhanced response with metadata
    result = rating.to_dict()
    result["weight"] = weight
    result["weighted_score"] = score * (weight / 5)
    result["mutual_confirmed"] = metadata.get("mutual_confirmed", False)
    result["employment_verified"] = metadata.get("employment_verified", False)
    result["verification_level"] = metadata.get("verification_level", 0)
    
    return result


def rating_to_dict(rating: Rating) -> dict:
    """Convert rating to dictionary"""
    return {
        'id': rating.id,
        'rater_id': rating.rater_id,
        'rated_user_id': rating.rated_user_id,
        'rater_name': rating.rater_name,
        'score': rating.score,
        'category': rating.category,
        'review': rating.review,
        'company': rating.company,
        'is_anonymous': rating.is_anonymous,
        'is_flagged': rating.is_flagged,
        'flag_reason': rating.flag_reason,
        'is_reviewed': rating.is_reviewed,
        'created_at': rating.created_at.isoformat() if rating.created_at else None,
    }


@router.get("/users/{user_id}")
async def get_user_ratings(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Get ratings for a specific user.
    
    - Returns only public ratings by default
    - Authenticated user can see their own ratings
    - Admins can see all ratings
    """
    
    # Check user exists
    user_result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Build query - Don't show flagged ratings unless admin
    query = select(Rating).where(
        Rating.rated_user_id == user_id
    )
    
    # Filter by flag status
    if not current_user or current_user.role != "admin":
        query = query.where(Rating.is_flagged == False)
    
    # Count total
    count_result = await session.execute(
        select(func.count(Rating.id)).where(Rating.rated_user_id == user_id)
    )
    total = count_result.scalar() or 0
    
    # Get ratings with pagination
    query = query.order_by(desc(Rating.created_at)).offset(skip).limit(limit)
    result = await session.execute(query)
    ratings = result.scalars().all()
    
    return {
        "items": [rating_to_dict(r) for r in ratings],
        "total": total,
        "skip": skip,
        "limit": limit,
        "average_rating": _calculate_average_rating([r for r in ratings if not r.is_flagged])
    }


@router.get("/{rating_id}")
async def get_rating(
    rating_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get a specific rating"""
    
    query = select(Rating).where(Rating.id == rating_id)
    result = await session.execute(query)
    rating = result.scalars().first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating with ID {rating_id} not found"
        )
    
    if rating.is_flagged and (not current_user or current_user.role != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This rating has been flagged and is not available"
        )
    
    return rating_to_dict(rating)


@router.put("/{rating_id}")
async def update_rating(
    rating_id: int,
    score: int = Query(..., ge=1, le=5),
    category: str = Query(...),
    review: str = Query("", max_length=1000),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Update a rating (only rater can update, once per year - enforced).
    """
    
    query = select(Rating).where(Rating.id == rating_id)
    result = await session.execute(query)
    rating = result.scalars().first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating with ID {rating_id} not found"
        )
    
    # Only rater can update
    if rating.rater_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own ratings"
        )
    
    # Enforce annual update limit
    can_update, error_msg = await AntiGamingMeasures.check_annual_update_limit(
        session, rating_id, current_user.id
    )
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Update fields
    rating.score = score
    rating.category = category
    rating.review = review
    
    # Recalculate flags if updated
    is_suspicious, flag_reason = await AntiGamingMeasures.detect_suspicious_patterns(
        session, rating.rated_user_id
    )
    rating.is_flagged = is_suspicious
    rating.flag_reason = flag_reason
    
    await session.commit()
    
    return rating_to_dict(rating)


@router.get("/users/{user_id}/reputation")
async def get_user_reputation_score(
    user_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Get weighted reputation score for a user.
    
    Returns:
    - average_score: Simple average (1-5)
    - weighted_score: Weighted by relationship type
    - total_points: Sum of weighted points
    - breakdown: Scores by category
    """
    
    # Check user exists
    user_result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Calculate weighted reputation
    reputation = await AntiGamingMeasures.calculate_user_reputation_score(session, user_id)
    
    return {
        "user_id": user_id,
        "username": user.username,
        **reputation
    }


@router.delete("/{rating_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Delete a rating (only rater can delete)"""
    
    query = select(Rating).where(Rating.id == rating_id)
    result = await session.execute(query)
    rating = result.scalars().first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating with ID {rating_id} not found"
        )
    
    if rating.rater_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own ratings"
        )
    
    await session.delete(rating)
    await session.commit()
    
    logger.info(f"Rating {rating_id} deleted by {current_user.id}")


@router.post("/{rating_id}/flag")
async def flag_rating(
    rating_id: int,
    reason: str = Query(..., min_length=10, max_length=500),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Flag a rating for admin review (requires admin role).
    
    Used to flag suspicious patterns, inappropriate content, or gaming attempts.
    Flagged ratings are hidden from public display until reviewed.
    """
    
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can flag ratings"
        )
    
    query = select(Rating).where(Rating.id == rating_id)
    result = await session.execute(query)
    rating = result.scalars().first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating with ID {rating_id} not found"
        )
    
    rating.is_flagged = True
    rating.flag_reason = reason
    
    await session.commit()
    
    logger.warning(f"Rating {rating_id} flagged by admin {current_user.id}: {reason}")
    
    return {"status": "flagged", "rating_id": rating_id, "reason": reason}


@router.post("/{rating_id}/review")
async def review_flagged_rating(
    rating_id: int,
    approved: bool,
    review_notes: str = Query(None, max_length=1000),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Review a flagged rating (admin only).
    
    - approved=True: Rating passes review, unflag and allow display
    - approved=False: Rating fails review, delete or keep hidden
    """
    
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can review ratings"
        )
    
    query = select(Rating).where(Rating.id == rating_id)
    result = await session.execute(query)
    rating = result.scalars().first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating with ID {rating_id} not found"
        )
    
    if approved:
        rating.is_flagged = False
        rating.flag_reason = None
    
    rating.is_reviewed = True
    rating.review_notes = review_notes
    
    await session.commit()
    
    logger.info(f"Rating {rating_id} reviewed by admin {current_user.id}: approved={approved}")
    
    return {
        "status": "reviewed",
        "rating_id": rating_id,
        "approved": approved,
        "review_notes": review_notes
    }


def _calculate_average_rating(ratings: list[Rating]) -> float:
    """Calculate average rating"""
    if not ratings:
        return 0.0
    return round(sum(r.score for r in ratings) / len(ratings), 2)


def _calculate_rating_distribution(ratings: list[Rating]) -> dict:
    """Calculate distribution of ratings for statistics"""
    if not ratings:
        return {
            "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
            "average": 0.0
        }
    
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    total = 0
    
    for rating in ratings:
        rating_val = rating.score
        if 1 <= rating_val <= 5:
            distribution[str(rating_val)] += 1
            total += rating.score
    
    average = total / len(ratings) if ratings else 0.0
    distribution["average"] = round(average, 2)
    
    return distribution
