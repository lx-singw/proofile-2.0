"""
Rating Requests API - Invite logic for rating requests

Separate from core.py for better organization.
Handles invitation management, reminders, and link generation.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.rating_request import RatingRequest
from app.tasks.ratings import send_rating_request_email

router = APIRouter(prefix="/requests", tags=["rating-requests"])


class BulkInviteRequest(BaseModel):
    """Invite multiple people at once."""
    emails: List[EmailStr]
    relationship: str
    company: str
    message: Optional[str] = None


class ReminderRequest(BaseModel):
    """Send a reminder for a pending request."""
    request_id: int


@router.post("/bulk-invite")
async def bulk_invite(
    data: BulkInviteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create multiple rating requests at once.
    Max 5 invites per batch.
    """
    if len(data.emails) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 invites per batch"
        )
    
    created = []
    base_url = "https://proofile.com"
    
    for email in data.emails:
        # Check for existing pending request
        existing = db.query(RatingRequest).filter(
            RatingRequest.requester_id == current_user.id,
            RatingRequest.invitee_email == email,
            RatingRequest.status == "pending"
        ).first()
        
        if existing:
            continue
        
        # Create request
        request = RatingRequest(
            requester_id=current_user.id,
            token=RatingRequest.generate_token(),
            invitee_email=email,
            relationship_type=data.relationship,
            company=data.company,
            personal_message=data.message,
            expires_at=RatingRequest.default_expiration(),
            share_channel="email"
        )
        
        db.add(request)
        db.flush()
        
        # Queue email
        background_tasks.add_task(
            send_rating_request_email.delay,
            recipient_email=email,
            requester_name=current_user.full_name or current_user.email,
            company=data.company,
            relationship=data.relationship,
            magic_link=request.get_share_url(base_url)
        )
        
        created.append({
            "email": email,
            "request_id": request.id,
            "share_url": request.get_share_url(base_url)
        })
    
    db.commit()
    
    return {
        "success": True,
        "created_count": len(created),
        "requests": created
    }


@router.post("/send-reminder")
async def send_reminder(
    data: ReminderRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Send a reminder email for a pending rating request.
    Max 1 reminder per 7 days.
    """
    request = db.query(RatingRequest).filter(
        RatingRequest.id == data.request_id,
        RatingRequest.requester_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found"
        )
    
    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only remind for pending requests"
        )
    
    if request.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has expired"
        )
    
    # TODO: Check last reminder date
    
    base_url = "https://proofile.com"
    background_tasks.add_task(
        send_rating_request_email.delay,
        recipient_email=request.invitee_email,
        requester_name=current_user.full_name or current_user.email,
        company=request.company,
        relationship=request.relationship_type,
        magic_link=request.get_share_url(base_url)
    )
    
    return {"success": True, "message": "Reminder sent"}


@router.delete("/{request_id}")
async def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel a pending rating request.
    """
    request = db.query(RatingRequest).filter(
        RatingRequest.id == request_id,
        RatingRequest.requester_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating request not found"
        )
    
    if request.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed requests"
        )
    
    request.status = "declined"
    db.commit()
    
    return {"success": True, "message": "Request cancelled"}


@router.get("/pending-count")
async def get_pending_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get count of pending rating requests.
    """
    count = db.query(RatingRequest).filter(
        RatingRequest.requester_id == current_user.id,
        RatingRequest.status == "pending"
    ).count()
    
    return {"pending_count": count}
