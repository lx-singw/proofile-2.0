"""
Rating Moderation API - Report handling and content moderation

Endpoints for:
- Reporting abusive reviews
- Admin moderation queue
- Content filtering
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.social import Rating

router = APIRouter(prefix="/moderation", tags=["rating-moderation"])


class ReportReason(str, Enum):
    HARASSMENT = "harassment"
    FALSE_INFO = "false_info"
    CONFLICT = "conflict"
    PII = "pii"
    SPAM = "spam"
    OTHER = "other"


class ReportCreate(BaseModel):
    review_id: str
    reason: ReportReason
    details: Optional[str] = None


class ModerationDecision(BaseModel):
    report_id: int
    decision: str  # "approve", "remove", "flag"
    notes: Optional[str] = None


# In-memory storage for reports (in production, use a database table)
_reports: List[dict] = []


@router.post("/report")
async def report_review(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Report a review for moderation.
    
    Users can report reviews for:
    - Harassment
    - False information
    - Conflict of interest
    - Personal information exposure
    - Spam
    """
    # Verify review exists
    review = db.query(Rating).filter(Rating.id == int(data.review_id)).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Check for duplicate reports
    existing_report = next(
        (r for r in _reports 
         if r["review_id"] == data.review_id 
         and r["reporter_id"] == current_user.id),
        None
    )
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reported this review"
        )
    
    # Create report
    report = {
        "id": len(_reports) + 1,
        "review_id": data.review_id,
        "reporter_id": current_user.id,
        "reason": data.reason.value,
        "details": data.details,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    
    _reports.append(report)
    
    # If multiple reports on same review, auto-flag for priority
    report_count = sum(1 for r in _reports if r["review_id"] == data.review_id)
    if report_count >= 3:
        review.status = "flagged"
        db.commit()
    
    return {
        "success": True,
        "report_id": report["id"],
        "message": "Report submitted. Our Trust & Safety team will review within 24-48 hours."
    }


@router.get("/queue")
async def get_moderation_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get pending reports for moderation (admin only).
    """
    # TODO: Add admin check
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    pending = [r for r in _reports if r["status"] == "pending"]
    
    return {
        "pending_count": len(pending),
        "reports": pending[:50]  # Limit to 50
    }


@router.post("/decide")
async def make_moderation_decision(
    data: ModerationDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Make a moderation decision on a report (admin only).
    
    Decisions:
    - approve: Keep the review visible
    - remove: Hide the review
    - flag: Keep visible but mark for monitoring
    """
    # TODO: Add admin check
    
    report = next((r for r in _reports if r["id"] == data.report_id), None)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Update report status
    report["status"] = "resolved"
    report["decision"] = data.decision
    report["resolved_by"] = current_user.id
    report["resolved_at"] = datetime.utcnow().isoformat()
    report["notes"] = data.notes
    
    # Take action on review
    review = db.query(Rating).filter(Rating.id == int(report["review_id"])).first()
    if review:
        if data.decision == "remove":
            review.visibility = "hidden"
            review.status = "removed"
        elif data.decision == "flag":
            review.status = "flagged"
        else:  # approve
            review.status = "approved"
        
        db.commit()
    
    return {
        "success": True,
        "message": f"Review {data.decision}d successfully"
    }


@router.get("/stats")
async def get_moderation_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get moderation statistics (admin only).
    """
    # TODO: Add admin check
    
    total = len(_reports)
    pending = sum(1 for r in _reports if r["status"] == "pending")
    resolved = sum(1 for r in _reports if r["status"] == "resolved")
    
    by_reason = {}
    for r in _reports:
        reason = r["reason"]
        by_reason[reason] = by_reason.get(reason, 0) + 1
    
    return {
        "total_reports": total,
        "pending": pending,
        "resolved": resolved,
        "by_reason": by_reason
    }
