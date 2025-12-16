"""
Ratings API Router - Core CRUD operations

Endpoints:
- POST /request - Create rating request with magic link
- POST /submit - Submit rating via token
- GET /{user_id}/summary - Get reputation summary
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.rating_request import RatingRequest
from app.models.rating import Rating
from app.models.reputation_stats import UserReputationStats
from app.tasks.ratings import recalculate_reputation, send_rating_request_email, moderate_rating_content

router = APIRouter()


# ============ Schemas ============

class RatingRequestCreate(BaseModel):
    """Create a new rating request."""
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    relationship: str = Field(..., pattern="^(manager|peer|report|client|mentor|colleague)$")
    company: str = Field(..., min_length=1, max_length=255)
    role_at_company: Optional[str] = None
    personal_message: Optional[str] = None


class RatingRequestResponse(BaseModel):
    """Response after creating a rating request."""
    id: int
    token: str
    status: str
    share_url: str
    whatsapp_url: str
    expires_at: datetime
    
    class Config:
        from_attributes = True


class RatingSubmit(BaseModel):
    """Submit a rating via token."""
    token: str
    overall_score: float = Field(..., ge=1.0, le=5.0)
    dimensions: Optional[dict] = None  # {"communication": 4.5, "reliability": 5.0}
    text_content: Optional[str] = Field(None, max_length=2000)
    is_anonymous: bool = False
    rater_email: Optional[EmailStr] = None
    rater_name: Optional[str] = None


class ReputationSummary(BaseModel):
    """User's reputation summary."""
    user_id: int
    global_score: float
    percentile: int
    total_reviews: int
    manager_score: Optional[float]
    peer_score: Optional[float]
    dimension_scores: dict
    signals: List[str]
    level: str
    badge: dict


class DimensionScore(BaseModel):
    """Individual dimension score."""
    name: str
    score: float
    count: int


# ============ Endpoints ============

@router.post("/request", response_model=RatingRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_rating_request(
    data: RatingRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new rating request and generate shareable links.
    
    Users can share via email, WhatsApp, SMS, or copy-paste link.
    Requests expire after 30 days.
    """
    # Rate limit: max 10 requests per day per user
    today_count = db.query(RatingRequest).filter(
        RatingRequest.requester_id == current_user.id,
        RatingRequest.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    
    if today_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum 10 rating requests per day. Please try again tomorrow."
        )
    
    # Create request
    request = RatingRequest(
        requester_id=current_user.id,
        token=RatingRequest.generate_token(),
        invitee_email=data.recipient_email,
        invitee_name=data.recipient_name,
        relationship_type=data.relationship,
        company=data.company,
        role_at_company=data.role_at_company,
        personal_message=data.personal_message,
        expires_at=RatingRequest.default_expiration(),
        share_channel="email"
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    # Send email in background
    base_url = "https://proofile.com"  # In prod, get from settings
    magic_link = request.get_share_url(base_url)
    
    background_tasks.add_task(
        send_rating_request_email.delay,
        recipient_email=data.recipient_email,
        requester_name=current_user.full_name or current_user.email,
        company=data.company,
        relationship=data.relationship,
        magic_link=magic_link
    )
    
    return RatingRequestResponse(
        id=request.id,
        token=request.token,
        status=request.status,
        share_url=magic_link,
        whatsapp_url=request.get_whatsapp_url(base_url),
        expires_at=request.expires_at
    )


@router.get("/request/{token}")
async def get_rating_request(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get rating request details by token.
    Used by the rating form to show context.
    """
    request = db.query(RatingRequest).filter(
        RatingRequest.token == token
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found or expired"
        )
    
    if request.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This rating request has expired"
        )
    
    if request.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This rating has already been submitted"
        )
    
    # Get requester info
    requester = db.query(User).filter(User.id == request.requester_id).first()
    
    return {
        "request_id": request.id,
        "requester": {
            "name": requester.full_name if requester else "Unknown",
            "avatar_url": requester.avatar_url if requester else None
        },
        "relationship": request.relationship_type,
        "company": request.company,
        "role_at_company": request.role_at_company,
        "personal_message": request.personal_message,
        "expires_at": request.expires_at.isoformat()
    }


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_rating(
    data: RatingSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Submit a rating for a rating request.
    
    No authentication required - uses token from email link.
    Triggers async reputation recalculation.
    """
    # Find request by token
    request = db.query(RatingRequest).filter(
        RatingRequest.token == data.token
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found"
        )
    
    if request.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This rating request has expired"
        )
    
    if request.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This rating has already been submitted"
        )
    
    # Create rating
    rating = Rating(
        author_id=request.invitee_user_id,  # May be null for external raters
        target_id=request.requester_id,
        rating_request_id=request.id,
        overall_score=data.overall_score,
        dimensions=data.dimensions,
        text_content=data.text_content,
        relationship_type=request.relationship_type,
        context_company=request.company,
        is_anonymous=data.is_anonymous,
        visibility="public"
    )
    
    db.add(rating)
    
    # Update request status
    request.status = "completed"
    request.completed_at = datetime.utcnow()
    request.rating_id = rating.id
    
    # Store rater contact info if provided
    if data.rater_email:
        request.rater_verified_email = data.rater_email
    if data.rater_name:
        request.rater_verified_name = data.rater_name
    
    db.commit()
    db.refresh(rating)
    
    # Trigger async reputation recalculation
    background_tasks.add_task(
        recalculate_reputation.delay,
        user_id=request.requester_id
    )
    
    # Run content moderation if there's text
    if data.text_content:
        background_tasks.add_task(
            moderate_rating_content.delay,
            rating_id=rating.id,
            text_content=data.text_content
        )
    
    return {
        "success": True,
        "rating_id": rating.id,
        "message": "Thank you! Your rating has been submitted."
    }


@router.get("/reputation/me")
async def get_my_reputation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's reputation summary."""
    # Get cached stats
    stats = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == current_user.id
    ).first()
    
    if not stats:
        # Return empty/default reputation for new users
        return {
            "user_id": current_user.id,
            "global_score": 0,
            "percentile": 50,
            "total_reviews": 0,
            "manager_score": None,
            "peer_score": None,
            "dimension_scores": {},
            "signals": [],
            "level": "newcomer",
            "badge": {"color": "#9CA3AF", "label": "New", "score": 0}
        }
    
    return {
        "user_id": stats.user_id,
        "global_score": stats.global_score or 0,
        "percentile": stats.percentile or 50,
        "total_reviews": stats.total_reviews or 0,
        "manager_score": stats.manager_score,
        "peer_score": stats.peer_score,
        "dimension_scores": stats.dimension_scores or {},
        "signals": stats.signals or [],
        "level": stats.level or "newcomer",
        "badge": {"color": "#22C55E", "label": stats.level or "New", "score": stats.global_score or 0}
    }


@router.get("/reputation/{user_id}", response_model=ReputationSummary)
async def get_reputation_summary(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get reputation summary for a user.
    
    Returns cached stats from user_reputation_stats table.
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get cached stats
    stats = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == user_id
    ).first()
    
    if not stats:
        # Calculate on-demand if no cache exists
        from app.services.scoring import update_user_reputation_stats
        stats_dict = update_user_reputation_stats(db, user_id)
        
        return ReputationSummary(
            user_id=user_id,
            global_score=stats_dict["global_score"],
            percentile=stats_dict["percentile"],
            total_reviews=stats_dict["total_reviews"],
            manager_score=stats_dict.get("manager_score"),
            peer_score=stats_dict.get("peer_score"),
            dimension_scores=stats_dict.get("dimension_scores", {}),
            signals=stats_dict.get("signals", []),
            level="unranked",
            badge={"color": "#9CA3AF", "label": "Unranked", "score": 0}
        )
    
    return ReputationSummary(
        user_id=stats.user_id,
        global_score=stats.global_score,
        percentile=stats.percentile,
        total_reviews=stats.total_reviews,
        manager_score=stats.manager_score,
        peer_score=stats.peer_score,
        dimension_scores=stats.dimension_scores or {},
        signals=stats.signals or [],
        level=stats.get_level(),
        badge=stats.get_display_badge()
    )


@router.get("/my-requests")
async def get_my_rating_requests(
    status_filter: Optional[str] = Query(None, pattern="^(pending|completed|expired)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all rating requests created by current user.
    """
    try:
        query = db.query(RatingRequest).filter(
            RatingRequest.requester_id == current_user.id
        )
        
        if status_filter:
            query = query.filter(RatingRequest.status == status_filter)
        
        requests = query.order_by(RatingRequest.created_at.desc()).all()
        
        result = []
        for req in requests:
            try:
                item = req.to_dict()
                item["share_url"] = req.get_share_url()
                result.append(item)
            except Exception as e:
                # Skip malformed requests
                continue
        
        return result
    except Exception as e:
        return []


@router.get("/my-reviews")
async def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all ratings received by current user.
    """
    try:
        ratings = db.query(Rating).filter(
            Rating.target_id == current_user.id,
            Rating.visibility == "public"
        ).order_by(Rating.created_at.desc()).all()
        
        result = []
        for r in ratings:
            try:
                result.append({
                    "id": str(r.id),
                    "overall_score": r.overall_score or 0,
                    "dimensions": r.dimensions or {},
                    "text_content": r.text_content if not r.is_anonymous else None,
                    "relationship_type": r.relationship_type or "peer",
                    "context_company": r.context_company or "",
                    "is_anonymous": r.is_anonymous or False,
                    "created_at": r.created_at.isoformat() if r.created_at else None
                })
            except Exception:
                continue
        
        return result
    except Exception as e:
        return []
