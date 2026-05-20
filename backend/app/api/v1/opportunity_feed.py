"""
Opportunity Feed API — Sprint 1/2 Foundation

Endpoints:
  GET  /api/v1/feed/opportunities  — cursor-based ranked feed (no auth required)
  POST /api/v1/feed/signals        — record a user/session interaction signal
  GET  /api/v1/feed/insight-cards  — personalised insight card pool
  GET  /api/v1/feed/stats          — live feed stats (trust nudge numbers)
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_optional
from app.core.config import settings
from app.models.opportunity import FeedSignal, OpportunityActivity
from app.models.reputation_stats import UserReputationStats
from app.models.verified_review import VerifiedReview
from app.models.user import User
from app.services import feed_ranking
from app.services.insight_card_generator import (
    generate_trust_insight_cards,
    generate_market_intelligence_cards,
    generate_community_proof_cards,
    generate_graph_discovery_cards,
)

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

class MatchReason(BaseModel):
    label: str       # e.g. "Node.js — verified by your reviewers"
    strength: str    # "verified" | "stated" | "inferred"


class MatchContext(BaseModel):
    state: str                      # "anonymous" | "profile" | "verified"
    reasons: list[MatchReason]
    match_strength_percent: int     # 0–100
    proofile_score_percentile: int  # 0–100, 0 for anon/profile
    reviewer_connections: int       # 0 for anon/profile


class OpportunityCard(BaseModel):
    id: int
    title: str
    company_name: str
    description: str = ''
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
    source_platform: Optional[str] = None
    source_url: Optional[str] = None
    application_url: Optional[str] = None
    is_direct: bool
    quality_score: float
    posted_at: Optional[datetime]
    expires_at: Optional[datetime]
    # Social proof fields
    interested_count: int = 0
    saved_count: int = 0
    viewer_is_interested: bool = False
    viewer_has_saved: bool = False
    # Match context — varies by user state
    match_context: Optional[MatchContext] = None

    model_config = {"from_attributes": True}


class FeedPage(BaseModel):
    items: list[OpportunityCard]
    next_cursor: Optional[int] = None
    has_more: bool


# ── Match context helpers ────────────────────────────────────────────────────

def _parse_skills(raw: Optional[str]) -> list[str]:
    """Parse a JSON skills string into a list, tolerating malformed input."""
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(s).strip() for s in parsed if s]
    except (ValueError, TypeError):
        pass
    # Fallback: comma-separated plain text
    return [s.strip() for s in raw.split(",") if s.strip()]


def _build_match_context(
    opp_required_skills: Optional[str],
    *,
    user_skills: list[str],
    verified_skills: list[str],
    trust_score: int,
    percentile: int,
) -> MatchContext:
    """Build a MatchContext for one (user, opportunity) pair."""
    required = _parse_skills(opp_required_skills)
    required_lower = [r.lower() for r in required]

    if trust_score >= 60 and verified_skills:
        # Verified state
        matched = [s for s in verified_skills if s.lower() in required_lower]
        if not matched and required:
            matched = verified_skills[:2]  # Show top skills even if no exact overlap
        strength = min(100, len(matched) * 20 + percentile // 2)
        return MatchContext(
            state="verified",
            reasons=[
                MatchReason(label=f"{s} — verified by your reviewers", strength="verified")
                for s in matched[:3]
            ] or [MatchReason(label="Your verified profile matches this role", strength="verified")],
            match_strength_percent=strength,
            proofile_score_percentile=percentile,
            reviewer_connections=0,
        )

    if trust_score > 0 and user_skills:
        # Profile state (logged in, not yet verified)
        matched = [s for s in user_skills if s.lower() in required_lower]
        strength = min(70, len(matched) * 18)
        return MatchContext(
            state="profile",
            reasons=[
                MatchReason(label=f"{s} — on your profile (unverified)", strength="stated")
                for s in matched[:3]
            ] or [MatchReason(label="Role matches your stated profile", strength="stated")],
            match_strength_percent=strength,
            proofile_score_percentile=0,
            reviewer_connections=0,
        )

    # Anonymous
    return MatchContext(
        state="anonymous",
        reasons=[MatchReason(label="Trending opportunity in South Africa", strength="inferred")],
        match_strength_percent=0,
        proofile_score_percentile=0,
        reviewer_connections=0,
    )


async def _get_user_match_data(
    db: AsyncSession, user: User
) -> tuple[list[str], list[str], int, int]:
    """
    Return (user_skills, verified_skills, trust_score, percentile) for a logged-in user.
    All values safe to use even if underlying records are missing.
    """
    user_skills = _parse_skills(getattr(user, "skills", None))
    trust_score = int(getattr(user, "trust_score", 0) or 0)

    # Collect endorsed_skills from published reviews
    reviews_result = await db.execute(
        select(VerifiedReview.endorsed_skills)
        .where(
            VerifiedReview.reviewee_id == user.id,
            VerifiedReview.status == "published",
        )
        .limit(20)
    )
    verified_skills: list[str] = []
    seen: set[str] = set()
    for (endorsed,) in reviews_result.all():
        if endorsed:
            skills = endorsed if isinstance(endorsed, list) else []
            for s in skills:
                sl = str(s).strip().lower()
                if sl and sl not in seen:
                    verified_skills.append(str(s).strip())
                    seen.add(sl)

    # Percentile from reputation stats
    rep_result = await db.execute(
        select(UserReputationStats.percentile).where(UserReputationStats.user_id == user.id)
    )
    percentile = int(rep_result.scalar_one_or_none() or 0)

    return user_skills, verified_skills, trust_score, percentile


class SignalIn(BaseModel):
    session_id: str = Field(..., max_length=128)
    opportunity_id: Optional[int] = None
    card_type: str = Field(..., max_length=50)
    signal_type: str = Field(
        ...,
        max_length=50,
        pattern=r"^(view|dwell_3s|dwell_10s|expand|interest|dismiss|save|share|apply_click|scroll_past)$",
    )
    feed_position: Optional[int] = None
    session_duration_ms: Optional[int] = None


VALID_SIGNAL_TYPES = {
    "view", "dwell_3s", "dwell_10s", "expand",
    "interest", "dismiss", "save", "share", "apply_click", "scroll_past",
}

VALID_CARD_TYPES = {"opportunity", "insight", "graph", "market", "community"}

SIGNAL_ACTIVITY_TYPES = {
    "share": "shared",
    "apply_click": "applied",
}


async def _record_activity(
    db: AsyncSession,
    opportunity_id: int,
    user_id: int | None,
    activity_type: str,
    toggle: bool = False,
) -> OpportunityActivity:
    if activity_type not in {"interested", "saved", "shared", "applied"}:
        raise HTTPException(status_code=400, detail="Unsupported activity type")

    existing_row = None
    if user_id is not None:
        existing = await db.execute(
            select(OpportunityActivity).where(
                OpportunityActivity.user_id == user_id,
                OpportunityActivity.opportunity_id == opportunity_id,
                OpportunityActivity.activity_type == activity_type,
            )
        )
        existing_row = existing.scalar_one_or_none()

    if existing_row:
        existing_row.is_active = not existing_row.is_active if toggle else True
        return existing_row

    activity = OpportunityActivity(
        user_id=user_id,
        opportunity_id=opportunity_id,
        activity_type=activity_type,
        is_active=True,
    )
    db.add(activity)
    return activity


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/opportunities", response_model=FeedPage)
async def get_opportunity_feed(
    request: Request,
    response: Response,
    cursor: Optional[int] = Query(None, description="Last seen opportunity id (exclusive)"),
    location: Optional[str] = Query(None, max_length=100, description="City or province for location boosting"),
    category: Optional[str] = Query(None, max_length=100, description="Opportunity category filter: jobs, training_skills_programs, bursaries"),
    opportunity_type: Optional[str] = Query(None, max_length=100, description="Comma-separated list of types: job,internship,bursary,learnership"),
    inferred_location: Optional[str] = Query(None, max_length=100, description="Inferred location from anonymous session signals"),
    inferred_skills: Optional[str] = Query(None, max_length=200, description="Comma-separated inferred skills from session signals"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Return a ranked page of opportunity cards.

    - Works for anonymous users (no auth required).
    - Pass `cursor` from a previous response's `next_cursor` to paginate.
    - Optionally pass `location` (e.g. "Johannesburg") for location-boosted ranking.
    - Optionally pass `category` to filter by high-level opportunity category.
    - Optionally pass `opportunity_type` (comma-separated) to filter by type.
    - Optionally pass `inferred_location` and `inferred_skills` for anonymous session-based ranking.
    """
    # Ensure session cookie is set even for anonymous visitors
    _get_or_create_session_id(request, response)

    # Derive location: prefer explicit query param, then user profile
    resolved_location = location
    if not resolved_location and current_user:
        resolved_location = getattr(current_user, "location", None) or getattr(
            getattr(current_user, "profile", None), "location", None
        )

    # Parse comma-separated opportunity types if provided
    parsed_types: Optional[List[str]] = None
    if opportunity_type:
        parsed_types = [t.strip().lower() for t in opportunity_type.split(',') if t.strip()]

    # Parse inferred skills
    parsed_inferred_skills: Optional[List[str]] = None
    if inferred_skills:
        parsed_inferred_skills = [s.strip() for s in inferred_skills.split(',') if s.strip()]

    opportunities, next_cursor = await feed_ranking.get_ranked_feed(
        db,
        cursor=cursor,
        location=resolved_location,
        user=current_user,
        inferred_location=inferred_location,
        inferred_skills=parsed_inferred_skills,
        opportunity_category=category.strip().lower() if category else None,
        opportunity_types=parsed_types,
    )

    # Pre-fetch user match data once for the whole page (avoids N+1 queries)
    user_skills: list[str] = []
    verified_skills: list[str] = []
    trust_score: int = 0
    percentile: int = 0
    if current_user:
        user_skills, verified_skills, trust_score, percentile = await _get_user_match_data(db, current_user)

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
        card.match_context = _build_match_context(
            opp.required_skills,
            user_skills=user_skills,
            verified_skills=verified_skills,
            trust_score=trust_score,
            percentile=percentile,
        )
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
        # FeedSignal.timestamp is TIMESTAMP WITHOUT TIME ZONE in Postgres.
        # Store UTC as a naive datetime to avoid asyncpg offset-naive/aware errors.
        timestamp=datetime.utcnow(),
    )
    db.add(signal)

    # If the user dismisses a card, record it in their feed state so it won't resurface
    if current_user and payload.signal_type == "dismiss" and payload.opportunity_id:
        await feed_ranking.record_dismissed(db, current_user.id, payload.opportunity_id)
    else:
        await db.commit()

    if current_user and payload.opportunity_id and payload.signal_type in SIGNAL_ACTIVITY_TYPES:
        await _record_activity(
            db,
            payload.opportunity_id,
            current_user.id,
            SIGNAL_ACTIVITY_TYPES[payload.signal_type],
            toggle=False,
        )
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


class ActivityOut(BaseModel):
    opportunity_id: int
    activity_type: str
    is_active: bool
    count: int


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
    from app.models.opportunity import Opportunity

    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify opportunity exists
    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing_row = await _record_activity(db, opportunity_id, current_user.id, "interested", toggle=True)

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


async def _count_activity(db: AsyncSession, opportunity_id: int, activity_type: str) -> int:
    count_row = await db.execute(
        select(func.count(OpportunityActivity.id)).where(
            OpportunityActivity.opportunity_id == opportunity_id,
            OpportunityActivity.activity_type == activity_type,
            OpportunityActivity.is_active.is_(True),
        )
    )
    return count_row.scalar() or 0


async def _record_authenticated_activity_endpoint(
    opportunity_id: int,
    activity_type: str,
    toggle: bool,
    db: AsyncSession,
    current_user: User | None,
) -> ActivityOut:
    from app.models.opportunity import Opportunity

    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    row = await _record_activity(db, opportunity_id, current_user.id, activity_type, toggle=toggle)
    await db.commit()
    await db.refresh(row)
    total = await _count_activity(db, opportunity_id, activity_type)

    return ActivityOut(
        opportunity_id=opportunity_id,
        activity_type=activity_type,
        is_active=row.is_active,
        count=total,
    )


@router.post("/opportunities/{opportunity_id}/save", response_model=ActivityOut)
async def toggle_save(
    opportunity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    return await _record_authenticated_activity_endpoint(opportunity_id, "saved", True, db, current_user)


@router.post("/opportunities/{opportunity_id}/share", response_model=ActivityOut)
async def record_share(
    opportunity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    return await _record_authenticated_activity_endpoint(opportunity_id, "shared", False, db, current_user)


@router.post("/opportunities/{opportunity_id}/apply-click", response_model=ActivityOut)
async def record_apply_click(
    opportunity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    return await _record_authenticated_activity_endpoint(opportunity_id, "applied", False, db, current_user)


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


# ── Feed stats (for TrustNudge card real numbers) ───────────────────────────

class FeedStats(BaseModel):
    total_applicants_this_week: int
    verified_applicants_this_week: int


@router.get("/stats", response_model=FeedStats)
async def get_feed_stats(db: AsyncSession = Depends(get_db)):
    """
    Return live stats for the TrustNudge card.
    total_applicants_this_week: distinct sessions that fired an interest signal in the last 7 days.
    verified_applicants_this_week: subset of those where a user_id (logged-in) is known.
    """
    week_ago = datetime.utcnow() - timedelta(days=7)

    total_result = await db.execute(
        select(func.count(func.distinct(FeedSignal.session_id))).where(
            FeedSignal.signal_type == "interest",
            FeedSignal.timestamp >= week_ago,
        )
    )
    total = int(total_result.scalar_one() or 0)

    verified_result = await db.execute(
        select(func.count(func.distinct(FeedSignal.user_id))).where(
            FeedSignal.signal_type == "interest",
            FeedSignal.timestamp >= week_ago,
            FeedSignal.user_id.isnot(None),
        )
    )
    verified = int(verified_result.scalar_one() or 0)

    return FeedStats(
        total_applicants_this_week=max(total, verified),
        verified_applicants_this_week=verified,
    )


# ── Personalised insight cards ───────────────────────────────────────────────

class InsightCardPayload(BaseModel):
    type: str
    id: str
    headline: str
    body: str
    cta_label: Optional[str] = None
    cta_href: Optional[str] = None
    icon_key: str


class InsightCardsResponse(BaseModel):
    cards: list[InsightCardPayload]


@router.get("/insight-cards", response_model=InsightCardsResponse)
async def get_insight_cards(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Return a batch of personalised insight cards (trust, market, community, graph).
    Called once on feed mount; frontend replaces static card pools with these.
    """
    cards = (
        await generate_trust_insight_cards(current_user, db)
        + await generate_market_intelligence_cards(db)
        + await generate_community_proof_cards(db)
        + await generate_graph_discovery_cards(current_user, db)
    )
    return InsightCardsResponse(cards=[InsightCardPayload(**c) for c in cards])
