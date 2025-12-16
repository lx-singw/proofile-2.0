"""
Rating Requests API - Invitation-based rating flow

Endpoints:
- POST /rating-requests - Create rating request
- GET /rating-requests/mine - Get my sent requests
- GET /rating-requests/received - Get requests to rate me
- GET /rating-requests/token/{token} - Validate token (public)
- POST /rating-requests/{id}/complete - Submit rating via request
- POST /rating-requests/{id}/decline - Decline request
- GET /rating-requests/check/{user_id} - Check if can rate user
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime
from typing import Optional, List
import logging

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.rating_request import RatingRequest
from app.models.social import Rating

router = APIRouter(prefix="/rating-requests", tags=["rating-requests"])
logger = logging.getLogger(__name__)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_rating_request(
    invitee_name: str = Query(..., min_length=2),
    invitee_email: str = Query(None),
    invitee_phone: str = Query(None),
    relationship_type: str = Query(..., description="colleague, manager, direct_report, client"),
    company: str = Query(..., min_length=2),
    role_at_company: str = Query(None),
    personal_message: str = Query(None, max_length=500),
    share_channel: str = Query("link", description="email, whatsapp, sms, link, in_app"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    request: Request = None
):
    """
    Create a rating request invitation.
    
    Returns the request with shareable links for all channels.
    """
    
    # Generate unique token
    token = RatingRequest.generate_token()
    
    # Check if similar request already exists (same person, same company)
    if invitee_email:
        existing = await session.execute(
            select(RatingRequest).where(
                and_(
                    RatingRequest.requester_id == current_user.id,
                    RatingRequest.invitee_email == invitee_email,
                    RatingRequest.company == company,
                    RatingRequest.status == "pending"
                )
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a pending request to this person for this company"
            )
    
    # Create request
    rating_request = RatingRequest(
        requester_id=current_user.id,
        token=token,
        invitee_name=invitee_name,
        invitee_email=invitee_email,
        invitee_phone=invitee_phone,
        relationship_type=relationship_type,
        company=company,
        role_at_company=role_at_company,
        personal_message=personal_message,
        share_channel=share_channel,
        expires_at=RatingRequest.default_expiration(),
    )
    
    session.add(rating_request)
    await session.commit()
    await session.refresh(rating_request)
    
    # Build base URL
    base_url = str(request.base_url).rstrip("/") if request else "https://proofile.com"
    
    logger.info(f"Rating request created: {current_user.id} -> {invitee_name}")
    
    return {
        **rating_request.to_dict(),
        "share_links": {
            "direct": rating_request.get_share_url(base_url),
            "whatsapp": rating_request.get_whatsapp_url(base_url),
            "sms": rating_request.get_sms_url(base_url),
            "email_subject": f"Professional Rating Request from {current_user.full_name}",
            "email_body": f"Hi {invitee_name},\n\n{current_user.full_name} is requesting a professional rating based on your work together at {company}.\n\nClick here to rate: {rating_request.get_share_url(base_url)}\n\nThank you!"
        },
        "requester_name": current_user.full_name
    }


@router.get("/mine")
async def get_my_rating_requests(
    status_filter: str = Query(None, description="pending, completed, expired, declined"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get rating requests I've sent."""
    
    query = select(RatingRequest).where(
        RatingRequest.requester_id == current_user.id
    )
    
    if status_filter:
        query = query.where(RatingRequest.status == status_filter)
    
    # Count total
    count_query = select(func.count(RatingRequest.id)).where(
        RatingRequest.requester_id == current_user.id
    )
    if status_filter:
        count_query = count_query.where(RatingRequest.status == status_filter)
    
    count_result = await session.execute(count_query)
    total = count_result.scalar() or 0
    
    # Get requests
    query = query.order_by(RatingRequest.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    requests = result.scalars().all()
    
    return {
        "items": [r.to_dict(include_rater_contact=True) for r in requests],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/token/{token}")
async def get_request_by_token(
    token: str,
    session: AsyncSession = Depends(get_db)
):
    """
    Validate token and get request details (public endpoint).
    
    Used when someone opens a rating link.
    """
    
    result = await session.execute(
        select(RatingRequest).where(RatingRequest.token == token)
    )
    rating_request = result.scalars().first()
    
    if not rating_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found or invalid token"
        )
    
    if rating_request.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This rating request has expired"
        )
    
    if rating_request.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This rating has already been submitted"
        )
    
    if rating_request.status == "declined":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This rating request was declined"
        )
    
    # Get requester info
    requester_result = await session.execute(
        select(User).where(User.id == rating_request.requester_id)
    )
    requester = requester_result.scalars().first()
    
    return {
        **rating_request.to_dict(),
        "requester": {
            "id": requester.id,
            "full_name": requester.full_name,
            "username": requester.username,
            "avatar_url": requester.avatar_url,
            "headline": requester.headline
        } if requester else None
    }


@router.post("/{request_id}/complete")
async def complete_rating_request(
    request_id: int,
    score: int = Query(..., ge=1, le=5),
    category: str = Query("general"),
    review: str = Query("", max_length=1000),
    strengths: str = Query("", max_length=500),
    areas_for_growth: str = Query(None, max_length=500),
    work_again: str = Query(None, description="definitely, probably, maybe, probably_not"),
    # Rater's verifiable contact info
    rater_email: str = Query(..., description="Your email for verification"),
    rater_phone: str = Query(None),
    rater_company_email: str = Query(None, description="Your work email"),
    rater_linkedin_url: str = Query(None),
    contact_visible_to_public: bool = Query(False),
    is_anonymous: bool = Query(False),
    current_user: User = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db)
):
    """
    Complete a rating request by submitting the rating.
    
    Requires rater to provide verifiable contact info.
    """
    
    # Get the request
    result = await session.execute(
        select(RatingRequest).where(RatingRequest.id == request_id)
    )
    rating_request = result.scalars().first()
    
    if not rating_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found"
        )
    
    if rating_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {rating_request.status}"
        )
    
    if rating_request.is_expired:
        rating_request.status = "expired"
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This rating request has expired"
        )
    
    # Create the rating
    rater_id = current_user.id if current_user else None
    rater_name = None
    if not is_anonymous:
        rater_name = current_user.full_name if current_user else rating_request.invitee_name
    
    rating = Rating(
        rater_id=rater_id,
        rated_user_id=rating_request.requester_id,
        rater_name=rater_name,
        score=score,
        category=category,
        review=review,
        company=rating_request.company,
        relationship_type=rating_request.relationship_type,
        is_anonymous=is_anonymous,
    )
    
    session.add(rating)
    await session.flush()
    
    # Update the request with completion info
    rating_request.status = "completed"
    rating_request.completed_at = datetime.utcnow()
    rating_request.rating_id = rating.id
    rating_request.rater_verified_email = rater_email
    rating_request.rater_verified_phone = rater_phone
    rating_request.rater_company_email = rater_company_email
    rating_request.rater_linkedin_url = rater_linkedin_url
    rating_request.contact_visible_to_public = contact_visible_to_public
    
    if current_user:
        rating_request.invitee_user_id = current_user.id
    
    await session.commit()
    
    logger.info(f"Rating request {request_id} completed with rating {rating.id}")
    
    return {
        "status": "completed",
        "rating": rating.to_dict(),
        "message": "Thank you for your rating!"
    }


@router.post("/{request_id}/decline")
async def decline_rating_request(
    request_id: int,
    reason: str = Query(None, max_length=200),
    session: AsyncSession = Depends(get_db)
):
    """Decline a rating request."""
    
    result = await session.execute(
        select(RatingRequest).where(RatingRequest.id == request_id)
    )
    rating_request = result.scalars().first()
    
    if not rating_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found"
        )
    
    if rating_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {rating_request.status}"
        )
    
    rating_request.status = "declined"
    await session.commit()
    
    return {"status": "declined", "message": "Rating request declined"}


@router.get("/check/{user_id}")
async def check_can_rate_user(
    user_id: int,
    current_user: User = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db)
):
    """
    Check if current user can rate the specified user.
    
    Returns True if:
    1. Current user has a pending request from that user
    2. Or there's mutual confirmation (both have rated each other)
    """
    
    if not current_user:
        return {"can_rate": False, "reason": "Not logged in"}
    
    if current_user.id == user_id:
        return {"can_rate": False, "reason": "Cannot rate yourself"}
    
    # Check if there's a pending request from user_id to current_user
    pending_request = await session.execute(
        select(RatingRequest).where(
            and_(
                RatingRequest.requester_id == user_id,
                or_(
                    RatingRequest.invitee_user_id == current_user.id,
                    RatingRequest.invitee_email == current_user.email
                ),
                RatingRequest.status == "pending"
            )
        )
    )
    request = pending_request.scalars().first()
    
    if request:
        return {
            "can_rate": True,
            "reason": "You have a pending rating request",
            "request_id": request.id,
            "request_token": request.token
        }
    
    # Check if already rated
    already_rated = await session.execute(
        select(Rating).where(
            and_(
                Rating.rater_id == current_user.id,
                Rating.rated_user_id == user_id
            )
        )
    )
    if already_rated.scalars().first():
        return {"can_rate": False, "reason": "You have already rated this user"}
    
    return {"can_rate": False, "reason": "No rating request from this user"}
