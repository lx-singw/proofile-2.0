"""
Reviews API — The core Proofile review request and submission system.

Two sets of endpoints:
1. Authenticated (profile owner): create requests, list, cancel, remind
2. Public (token-based): get review context, submit review
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.experience import WorkExperience
from app.models.verified_review import VerifiedReview, ReviewStatus
from app.schemas.verified_review import (
    ReviewRequestCreate,
    ReviewRequestResponse,
    ReviewSubmitPayload,
    ReviewSubmitContext,
    VerifiedReviewPublic,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================
# Authenticated Endpoints (Profile Owner)
# ============================================================

MAX_PENDING_PER_ENTRY = 3


@router.post("/request", response_model=ReviewRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_review_request(
    payload: ReviewRequestCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    """
    Create a review request for a work experience entry.
    Sends a branded email to the reviewer with a unique link.
    Max 3 pending requests per work entry.
    """
    # Verify work experience belongs to user
    result = await db.execute(
        select(WorkExperience).where(
            WorkExperience.id == payload.work_experience_id,
            WorkExperience.user_id == current_user.id,
        )
    )
    work_exp = result.scalar_one_or_none()
    if not work_exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience not found or does not belong to you",
        )

    # Block self-review
    if payload.reviewer_email.lower() == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot request a review from yourself",
        )

    # Check pending request limit
    pending_count_result = await db.execute(
        select(func.count(VerifiedReview.id)).where(
            VerifiedReview.work_experience_id == payload.work_experience_id,
            VerifiedReview.status == ReviewStatus.PENDING.value,
        )
    )
    pending_count = pending_count_result.scalar() or 0
    if pending_count >= MAX_PENDING_PER_ENTRY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_PENDING_PER_ENTRY} pending review requests per work entry",
        )

    # Check if this reviewer already reviewed this entry
    existing_result = await db.execute(
        select(VerifiedReview).where(
            VerifiedReview.work_experience_id == payload.work_experience_id,
            VerifiedReview.reviewer_email == payload.reviewer_email,
            VerifiedReview.status == ReviewStatus.PUBLISHED.value,
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reviewer has already submitted a review for this role",
        )

    # Create the review request
    review = VerifiedReview(
        token=VerifiedReview.generate_token(),
        reviewee_id=current_user.id,
        work_experience_id=payload.work_experience_id,
        reviewer_email=payload.reviewer_email,
        reviewer_name=payload.reviewer_name,
        relationship_type=payload.relationship_type,
        status=ReviewStatus.PENDING.value,
        expires_at=VerifiedReview.default_expiration(),
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    # Send email
    try:
        from app.services.email_service import email_service
        import os

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        review_link = f"{frontend_url}/rate/{review.token}"
        reviewee_name = current_user.full_name or "A colleague"

        email_service.send_review_request_email(
            to_email=payload.reviewer_email,
            reviewee_name=reviewee_name,
            reviewer_name=payload.reviewer_name or "there",
            company=work_exp.company,
            role_title=work_exp.title,
            review_link=review_link,
            personal_message=payload.personal_message,
        )
        logger.info(f"Review request email sent to {payload.reviewer_email} for review {review.id}")
    except Exception as e:
        logger.error(f"Failed to send review request email: {e}")
        # Don't fail the request if email fails — the token still works

    # Build response with work experience context
    return ReviewRequestResponse(
        id=review.id,
        work_experience_id=review.work_experience_id,
        reviewer_email=review.reviewer_email,
        reviewer_name=review.reviewer_name,
        relationship_type=review.relationship_type,
        status=review.status,
        expires_at=review.expires_at,
        reminder_sent_at=review.reminder_sent_at,
        completed_at=review.completed_at,
        created_at=review.created_at,
        company=work_exp.company,
        role_title=work_exp.title,
    )


@router.get("/requests", response_model=list[ReviewRequestResponse])
async def list_my_review_requests(
    status_filter: str = Query(None, description="Filter by status: pending, published, expired"),
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    """List all review requests created by the current user."""
    query = (
        select(VerifiedReview)
        .where(VerifiedReview.reviewee_id == current_user.id)
        .order_by(VerifiedReview.created_at.desc())
    )

    if status_filter:
        query = query.where(VerifiedReview.status == status_filter)

    result = await db.execute(query)
    reviews = result.scalars().all()

    # Fetch work experience data for context
    response = []
    for review in reviews:
        # Auto-expire if past expiration
        if review.status == ReviewStatus.PENDING.value and review.is_expired:
            review.status = ReviewStatus.EXPIRED.value
            db.add(review)

        exp_result = await db.execute(
            select(WorkExperience).where(WorkExperience.id == review.work_experience_id)
        )
        work_exp = exp_result.scalar_one_or_none()

        response.append(ReviewRequestResponse(
            id=review.id,
            work_experience_id=review.work_experience_id,
            reviewer_email=review.reviewer_email,
            reviewer_name=review.reviewer_name,
            relationship_type=review.relationship_type,
            status=review.status,
            expires_at=review.expires_at,
            reminder_sent_at=review.reminder_sent_at,
            completed_at=review.completed_at,
            created_at=review.created_at,
            company=work_exp.company if work_exp else None,
            role_title=work_exp.title if work_exp else None,
        ))

    await db.commit()  # Persist any auto-expiry updates
    return response


@router.delete("/requests/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_review_request(
    review_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    """Cancel a pending review request."""
    result = await db.execute(
        select(VerifiedReview).where(
            VerifiedReview.id == review_id,
            VerifiedReview.reviewee_id == current_user.id,
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review request not found")

    if review.status != ReviewStatus.PENDING.value:
        raise HTTPException(
            status_code=400,
            detail="Can only cancel pending review requests",
        )

    await db.delete(review)
    await db.commit()
    return None


@router.post("/requests/{review_id}/remind")
async def send_reminder(
    review_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    """Resend a reminder email for a pending review request."""
    result = await db.execute(
        select(VerifiedReview).where(
            VerifiedReview.id == review_id,
            VerifiedReview.reviewee_id == current_user.id,
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review request not found")

    if review.status != ReviewStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Can only remind pending requests")

    if review.is_expired:
        raise HTTPException(status_code=400, detail="This review request has expired")

    # Send reminder email
    try:
        from app.services.email_service import email_service
        import os

        exp_result = await db.execute(
            select(WorkExperience).where(WorkExperience.id == review.work_experience_id)
        )
        work_exp = exp_result.scalar_one_or_none()

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        review_link = f"{frontend_url}/rate/{review.token}"
        reviewee_name = current_user.full_name or "A colleague"

        email_service.send_review_request_email(
            to_email=review.reviewer_email,
            reviewee_name=reviewee_name,
            reviewer_name=review.reviewer_name or "there",
            company=work_exp.company if work_exp else "your shared workplace",
            role_title=work_exp.title if work_exp else "their role",
            review_link=review_link,
            is_reminder=True,
        )

        review.reminder_sent_at = datetime.utcnow()
        db.add(review)
        await db.commit()

    except Exception as e:
        logger.error(f"Failed to send reminder: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reminder email")

    return {"message": "Reminder sent successfully"}


# ============================================================
# Public Endpoints (Token-based, no auth required)
# ============================================================

@router.get("/submit/{token}", response_model=ReviewSubmitContext)
async def get_review_context(
    token: str,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Get the context for a review submission form.
    Public endpoint — no authentication required.
    Returns the reviewee name, company, role, and relationship context.
    """
    result = await db.execute(
        select(VerifiedReview).where(VerifiedReview.token == token)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review request not found")

    # Mark as viewed
    if not review.viewed_at:
        review.viewed_at = datetime.utcnow()
        db.add(review)
        await db.commit()

    # Check status
    if review.status == ReviewStatus.PUBLISHED.value:
        return ReviewSubmitContext(
            reviewee_name="",
            company="",
            role_title="",
            work_period="",
            relationship_type=review.relationship_type,
            reviewer_email=review.reviewer_email,
            is_already_submitted=True,
        )

    if review.is_expired:
        return ReviewSubmitContext(
            reviewee_name="",
            company="",
            role_title="",
            work_period="",
            relationship_type=review.relationship_type,
            reviewer_email=review.reviewer_email,
            is_expired=True,
        )

    # Fetch reviewee and work experience
    user_result = await db.execute(select(User).where(User.id == review.reviewee_id))
    reviewee = user_result.scalar_one_or_none()

    exp_result = await db.execute(
        select(WorkExperience).where(WorkExperience.id == review.work_experience_id)
    )
    work_exp = exp_result.scalar_one_or_none()

    # Format work period
    work_period = ""
    if work_exp:
        start = work_exp.start_date.strftime("%b %Y") if work_exp.start_date else ""
        if work_exp.is_current:
            work_period = f"{start} – Present"
        elif work_exp.end_date:
            work_period = f"{start} – {work_exp.end_date.strftime('%b %Y')}"
        else:
            work_period = start

    return ReviewSubmitContext(
        reviewee_name=reviewee.full_name if reviewee else "Unknown",
        reviewee_headline=reviewee.profile.headline if reviewee and reviewee.profile else None,
        company=work_exp.company if work_exp else "",
        role_title=work_exp.title if work_exp else "",
        work_period=work_period,
        relationship_type=review.relationship_type,
        reviewer_email=review.reviewer_email,
        reviewer_name=review.reviewer_name,
    )


@router.post("/submit/{token}", response_model=VerifiedReviewPublic)
async def submit_review(
    token: str,
    payload: ReviewSubmitPayload,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Submit a verified review. Public endpoint — no authentication required.
    The reviewer fills in their name, title, rating, and written review.
    After submission, the Proofile Score is recalculated.
    """
    result = await db.execute(
        select(VerifiedReview).where(VerifiedReview.token == token)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review request not found or invalid token")

    if review.status == ReviewStatus.PUBLISHED.value:
        raise HTTPException(status_code=400, detail="This review has already been submitted")

    if review.is_expired:
        raise HTTPException(status_code=400, detail="This review request has expired")

    # Fill in the review
    review.reviewer_name = payload.reviewer_name
    review.reviewer_title = payload.reviewer_title
    review.reviewer_company = payload.reviewer_company
    review.star_rating = payload.star_rating
    review.written_review = payload.written_review
    review.endorsed_skills = payload.endorsed_skills
    review.status = ReviewStatus.PUBLISHED.value
    review.completed_at = datetime.utcnow()

    # Compute seniority score from title
    review.reviewer_seniority_score = review.compute_seniority_score(payload.reviewer_title)

    # Check if reviewer has a Proofile account
    reviewer_result = await db.execute(
        select(User).where(User.email == review.reviewer_email)
    )
    reviewer_user = reviewer_result.scalar_one_or_none()
    if reviewer_user:
        review.reviewer_proofile_id = reviewer_user.id

    db.add(review)
    await db.commit()
    await db.refresh(review)

    # Recalculate Proofile Score for the reviewee
    try:
        from app.services.proofile_score import recalculate_proofile_score
        await recalculate_proofile_score(db, review.reviewee_id)
    except Exception as e:
        logger.error(f"Failed to recalculate Proofile Score: {e}")

    # Mark the work experience as verified if it has at least one review
    try:
        exp_result = await db.execute(
            select(WorkExperience).where(WorkExperience.id == review.work_experience_id)
        )
        work_exp = exp_result.scalar_one_or_none()
        if work_exp and not work_exp.is_verified:
            work_exp.is_verified = True
            db.add(work_exp)
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark work experience as verified: {e}")

    return VerifiedReviewPublic(
        id=review.id,
        reviewer_name=review.reviewer_name,
        reviewer_title=review.reviewer_title,
        reviewer_company=review.reviewer_company,
        relationship_type=review.relationship_type,
        star_rating=review.star_rating,
        written_review=review.written_review,
        endorsed_skills=review.endorsed_skills or [],
        reviewer_has_proofile=review.reviewer_proofile_id is not None,
        completed_at=review.completed_at,
    )
