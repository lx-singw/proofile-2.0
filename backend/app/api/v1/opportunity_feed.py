"""
Opportunity Feed API — Sprint 1/2 Foundation

Endpoints:
  GET  /api/v1/feed/opportunities  — cursor-based ranked feed (no auth required)
  POST /api/v1/feed/signals        — record a user/session interaction signal
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_optional
from app.core.config import settings
from app.models.opportunity import FeedSignal, OpportunityActivity
from app.models.user import User
from app.services import feed_ranking

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feed", tags=["opportunity-feed"])

# ── Session cookie ──────────────────────────────────────────────────────────
SESSION_COOKIE = "pf_feed_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _get_or_create_session_id(request: Request, response: Response) -> str:
    """
    Return the existing feed session cookie value, or create + set a new one.
    Session IDs are random UUIDs — no personal data stored in them.
    """
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            key=SESSION_COOKIE,
            value=session_id,
            max_age=SESSION_MAX_AGE,
            httponly=True,
            samesite=settings.COOKIE_SAMESITE,
            secure=settings.COOKIE_SECURE,
        )
    return session_id


# ── Pydantic schemas ────────────────────────────────────────────────────────

class OpportunityCard(BaseModel):
    id: int
    title: str
    company_name: str
    location: Optional[str]
    remote_type: Optional[str]
    opportunity_type: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_range: Optional[str]
    salary_visible: bool
    required_skills: Optional[str]
    experience_level: Optional[str]
    industry: Optional[str]
    source: Optional[str]
    is_direct: bool
    quality_score: float
    posted_at: Optional[datetime]
    expires_at: Optional[datetime]
    # Social proof fields
    interested_count: int = 0
    saved_count: int = 0
    viewer_is_interested: bool = False
    viewer_has_saved: bool = False

    model_config = {"from_attributes": True}


class FeedPage(BaseModel):
    items: list[OpportunityCard]
    next_cursor: Optional[int] = None
    has_more: bool


class SignalIn(BaseModel):
    session_id: str = Field(..., max_length=128)
    opportunity_id: Optional[int] = None
    card_type: str = Field(..., max_length=50)
    signal_type: str = Field(
        ...,
        max_length=50,
        pattern=r"^(view|dwell_3s|dwell_10s|expand|interest|dismiss|save|share|scroll_past)$",
    )
    feed_position: Optional[int] = None
    session_duration_ms: Optional[int] = None


VALID_SIGNAL_TYPES = {
    "view", "dwell_3s", "dwell_10s", "expand",
    "interest", "dismiss", "save", "share", "scroll_past",
}

VALID_CARD_TYPES = {"opportunity", "insight", "graph", "market", "community"}


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/opportunities", response_model=FeedPage)
async def get_opportunity_feed(
    request: Request,
    response: Response,
    cursor: Optional[int] = Query(None, description="Last seen opportunity id (exclusive)"),
    location: Optional[str] = Query(None, max_length=100, description="City or province for location boosting"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Return a ranked page of opportunity cards.

    - Works for anonymous users (no auth required).
    - Pass `cursor` from a previous response's `next_cursor` to paginate.
    - Optionally pass `location` (e.g. "Johannesburg") for location-boosted ranking.
    """
    # Ensure session cookie is set even for anonymous visitors
    _get_or_create_session_id(request, response)

    # Derive location: prefer explicit query param, then user profile
    resolved_location = location
    if not resolved_location and current_user:
        resolved_location = getattr(current_user, "location", None) or getattr(
            getattr(current_user, "profile", None), "location", None
        )

    opportunities, next_cursor = await feed_ranking.get_ranked_feed(
        db,
        cursor=cursor,
        location=resolved_location,
        user=current_user,
    )

    # Enrich with social proof counts
    opp_ids = [o.id for o in opportunities]
    interested_counts: dict[int, int] = {}
    saved_counts: dict[int, int] = {}
    user_interested_ids: set[int] = set()
    user_saved_ids: set[int] = set()

    if opp_ids:
        rows = await db.execute(
            select(
                OpportunityActivity.opportunity_id,
                OpportunityActivity.activity_type,
                func.count(OpportunityActivity.id).label("cnt"),
            )
            .where(
                OpportunityActivity.opportunity_id.in_(opp_ids),
                OpportunityActivity.activity_type.in_(["interested", "saved"]),
                OpportunityActivity.is_active.is_(True),
            )
            .group_by(OpportunityActivity.opportunity_id, OpportunityActivity.activity_type)
        )
        for row in rows.all():
            if row.activity_type == "interested":
                interested_counts[row.opportunity_id] = row.cnt
            else:
                saved_counts[row.opportunity_id] = row.cnt

        if current_user:
            user_rows = await db.execute(
                select(OpportunityActivity.opportunity_id, OpportunityActivity.activity_type)
                .where(
                    OpportunityActivity.user_id == current_user.id,
                    OpportunityActivity.opportunity_id.in_(opp_ids),
                    OpportunityActivity.is_active.is_(True),
                )
            )
            for row in user_rows.all():
                if row.activity_type == "interested":
                    user_interested_ids.add(row.opportunity_id)
                elif row.activity_type == "saved":
                    user_saved_ids.add(row.opportunity_id)

    items = []
    for opp in opportunities:
        card = OpportunityCard.model_validate(opp)
        card.interested_count = interested_counts.get(opp.id, 0)
        card.saved_count = saved_counts.get(opp.id, 0)
        card.viewer_is_interested = opp.id in user_interested_ids
        card.viewer_has_saved = opp.id in user_saved_ids
        items.append(card)

    return FeedPage(
        items=items,
        next_cursor=next_cursor,
        has_more=next_cursor is not None,
    )


@router.post("/signals", status_code=204)
async def record_signal(
    payload: SignalIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Record a feed interaction signal (view, dwell, expand, interest, dismiss, etc.).

    No response body on success (204). Called fire-and-forget from the frontend.
    """
    # Validate enums manually (pattern regex covers it, but belt-and-suspenders)
    if payload.signal_type not in VALID_SIGNAL_TYPES:
        return  # silently drop invalid signals rather than erroring the client
    if payload.card_type not in VALID_CARD_TYPES:
        return

    signal = FeedSignal(
        session_id=payload.session_id,
        user_id=current_user.id if current_user else None,
        opportunity_id=payload.opportunity_id,
        card_type=payload.card_type,
        signal_type=payload.signal_type,
        feed_position=payload.feed_position,
        session_duration_ms=payload.session_duration_ms,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(signal)

    # If the user dismisses a card, record it in their feed state so it won't resurface
    if current_user and payload.signal_type == "dismiss" and payload.opportunity_id:
        await feed_ranking.record_dismissed(db, current_user.id, payload.opportunity_id)
    else:
        await db.commit()

    # Update engagement_rate on the opportunity (lightweight increment)
    if payload.opportunity_id and payload.signal_type in {"dwell_3s", "dwell_10s", "expand", "interest"}:
        from sqlalchemy import update, func as sqlfunc
        from app.models.opportunity import Opportunity
        await db.execute(
            update(Opportunity)
            .where(Opportunity.id == payload.opportunity_id)
            .values(engagement_rate=sqlfunc.least(Opportunity.engagement_rate + 0.01, 1.0))
        )
        await db.commit()


# ── Interest toggle ─────────────────────────────────────────────────────────

class InterestToggleOut(BaseModel):
    opportunity_id: int
    is_interested: bool
    interested_count: int


@router.post("/opportunities/{opportunity_id}/interest", response_model=InterestToggleOut)
async def toggle_interest(
    opportunity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """
    Toggle the authenticated user's 'interested' state on an opportunity.
    Returns the new state and the updated aggregate count.
    Requires authentication (returns 401 if not logged in).
    """
    from fastapi import HTTPException
    from app.models.opportunity import Opportunity

    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify opportunity exists
    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Upsert the activity row
    existing = await db.execute(
        select(OpportunityActivity).where(
            OpportunityActivity.user_id == current_user.id,
            OpportunityActivity.opportunity_id == opportunity_id,
            OpportunityActivity.activity_type == "interested",
        )
    )
    existing_row = existing.scalar_one_or_none()

    if existing_row:
        existing_row.is_active = not existing_row.is_active
    else:
        existing_row = OpportunityActivity(
            user_id=current_user.id,
            opportunity_id=opportunity_id,
            activity_type="interested",
            is_active=True,
        )
        db.add(existing_row)

    await db.commit()
    await db.refresh(existing_row)

    # Count active interested records for this opportunity
    count_row = await db.execute(
        select(func.count(OpportunityActivity.id)).where(
            OpportunityActivity.opportunity_id == opportunity_id,
            OpportunityActivity.activity_type == "interested",
            OpportunityActivity.is_active.is_(True),
        )
    )
    total = count_row.scalar() or 0

    return InterestToggleOut(
        opportunity_id=opportunity_id,
        is_interested=existing_row.is_active,
        interested_count=total,
    )


# ── Activity feed for a single opportunity ──────────────────────────────────

class ActivityItem(BaseModel):
    user_id: Optional[int]
    activity_type: str
    created_at: datetime


class OppActivityPage(BaseModel):
    items: List[ActivityItem]
    total_interested: int
    total_saved: int


@router.get("/opportunities/{opportunity_id}/activity", response_model=OppActivityPage)
async def get_opportunity_activity(
    opportunity_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Return recent activity (interested/saved) for a specific opportunity.
    Used to power the social proof panel on the expanded card.
    """
    from fastapi import HTTPException
    from app.models.opportunity import Opportunity

    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    rows = await db.execute(
        select(OpportunityActivity)
        .where(
            OpportunityActivity.opportunity_id == opportunity_id,
            OpportunityActivity.is_active.is_(True),
        )
        .order_by(OpportunityActivity.created_at.desc())
        .limit(limit)
    )
    activity_rows = rows.scalars().all()

    counts = await db.execute(
        select(
            OpportunityActivity.activity_type,
            func.count(OpportunityActivity.id).label("cnt"),
        )
        .where(
            OpportunityActivity.opportunity_id == opportunity_id,
            OpportunityActivity.activity_type.in_(["interested", "saved"]),
            OpportunityActivity.is_active.is_(True),
        )
        .group_by(OpportunityActivity.activity_type)
    )
    count_map = {row.activity_type: row.cnt for row in counts.all()}

    return OppActivityPage(
        items=[
            ActivityItem(
                user_id=row.user_id,
                activity_type=row.activity_type,
                created_at=row.created_at,
            )
            for row in activity_rows
        ],
        total_interested=count_map.get("interested", 0),
        total_saved=count_map.get("saved", 0),
    )

