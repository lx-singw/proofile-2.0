"""
Feed Ranking Engine — Phase 0 (Rules-Based)

Scores and ranks opportunities for the feed. Phase 0 uses simple rules:
  1. Location match (inferred or stated vs listing)
  2. Engagement rate (click + dwell signals aggregated)
  3. Quality score (set by ingestion pipeline)
  4. Freshness (deprioritise listings older than 30 days)
  5. Salary completeness (listings with no salary score lower)

No ML or graph signals at this phase — those come in Phase 1 / Phase 2.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity, UserFeedState

if TYPE_CHECKING:
    from app.models.user import User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PAGE_SIZE = 20
FRESHNESS_DAYS = 30  # opportunities older than this are deprioritised

# Weight per scoring dimension (must sum to 1.0)
W_QUALITY = 0.30
W_TRUST = 0.10
W_ENGAGEMENT = 0.25
W_FRESHNESS = 0.20
W_SALARY_PRESENT = 0.10
W_LOCATION = 0.05


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

async def get_ranked_feed(
    db: AsyncSession,
    *,
    cursor: int | None = None,
    location: str | None = None,
    user: "User | None" = None,
    page_size: int = PAGE_SIZE,
    opportunity_category: str | None = None,
    opportunity_types: list[str] | None = None,
) -> tuple[list[Opportunity], int | None]:
    """
    Return a ranked page of opportunities for the feed.

    Args:
        db: async db session
        cursor: last seen opportunity id (exclusive) for cursor-based pagination
        location: inferred or stated city/province for location boosting
        user: authenticated user (None for anonymous)
        page_size: how many opportunities to return
        opportunity_category: optional category to filter by (e.g. 'jobs', 'training_skills_programs')
        opportunity_types: optional list of types to filter by (e.g. ['job', 'internship'])

    Returns:
        (opportunities, next_cursor) where next_cursor is None when there are no more results.
    """
    dismissed_ids: list[int] = []
    now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)

    if user:
        state = await _get_user_feed_state(db, user.id)
        if state and state.dismissed_ids:
            try:
                dismissed_ids = json.loads(state.dismissed_ids)
            except (ValueError, TypeError):
                dismissed_ids = []

    # Fetch a larger candidate pool (4× page_size) so we can re-rank before slicing
    candidate_pool_size = page_size * 4

    # Build base query: active, feed-eligible, non-dismissed, paginated by cursor
    stmt = select(Opportunity).where(
        Opportunity.is_active.is_(True),
        Opportunity.quality_score >= 0.40,
        or_(Opportunity.expires_at.is_(None), Opportunity.expires_at > now_utc_naive),
        or_(Opportunity.ai_status.is_(None), Opportunity.ai_status != "quarantine"),
    )

    if dismissed_ids:
        stmt = stmt.where(Opportunity.id.notin_(dismissed_ids))

    if opportunity_category:
        stmt = stmt.where(Opportunity.category == opportunity_category)

    if opportunity_types:
        stmt = stmt.where(Opportunity.opportunity_type.in_(opportunity_types))

    if cursor is not None:
        stmt = stmt.where(Opportunity.id < cursor)

    stmt = stmt.order_by(Opportunity.created_at.desc()).limit(candidate_pool_size)

    result = await db.execute(stmt)
    candidates = list(result.scalars().all())

    if not candidates:
        return [], None

    # Score & rank
    scored = [
        (opp, _score(opp, location=location))
        for opp in candidates
    ]
    scored.sort(key=lambda x: x[1], reverse=True)

    page = _apply_source_diversity(scored, page_size=page_size)
    next_cursor = page[-1].id if len(page) == page_size and len(candidates) == candidate_pool_size else None

    return page, next_cursor


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _score(opp: Opportunity, *, location: str | None) -> float:
    """Return a 0–1 ranking score for a single opportunity."""
    quality = float(opp.quality_score or 0.5)
    trust = float(opp.trust_score if opp.trust_score is not None else 0.5)
    engagement = min(float(opp.engagement_rate or 0.0), 1.0)
    freshness = _freshness_score(opp.posted_at or opp.created_at)
    salary_present = 1.0 if (opp.salary_min or opp.salary_max or opp.salary_range) else 0.0
    location_match = _location_score(opp.location, location)

    return (
        W_QUALITY * quality
        + W_TRUST * trust
        + W_ENGAGEMENT * engagement
        + W_FRESHNESS * freshness
        + W_SALARY_PRESENT * salary_present
        + W_LOCATION * location_match
    )


def _apply_source_diversity(
    scored: list[tuple[Opportunity, float]],
    *,
    page_size: int,
) -> list[Opportunity]:
    """Prefer a mixed set of sources by capping each source at two results per page."""
    counts: dict[str, int] = {}
    page: list[Opportunity] = []

    for opp, _score_value in scored:
        source_key = (opp.source_platform or opp.source or "unknown").lower()
        if counts.get(source_key, 0) >= 2:
            continue
        page.append(opp)
        counts[source_key] = counts.get(source_key, 0) + 1
        if len(page) == page_size:
            break

    return page


def _freshness_score(dt: datetime | None) -> float:
    """
    1.0 for opportunities posted today, decaying linearly to 0.0 at FRESHNESS_DAYS.
    Opportunities older than FRESHNESS_DAYS get 0.0.
    """
    if dt is None:
        return 0.5  # unknown age — neutral

    # Make timezone-aware if naive
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    age_days = (datetime.now(timezone.utc) - dt).days
    if age_days >= FRESHNESS_DAYS:
        return 0.0
    return max(0.0, 1.0 - age_days / FRESHNESS_DAYS)


def _location_score(opp_location: str | None, viewer_location: str | None) -> float:
    """Simple string-overlap location match. Returns 1.0 for a match, 0.0 for no signal."""
    if not opp_location or not viewer_location:
        return 0.5  # no data — neutral
    opp_loc = opp_location.lower()
    viewer_loc = viewer_location.lower()
    if viewer_loc in opp_loc or opp_loc in viewer_loc:
        return 1.0
    # Check province/city keywords overlap
    opp_tokens = set(opp_loc.replace(",", " ").split())
    viewer_tokens = set(viewer_loc.replace(",", " ").split())
    if opp_tokens & viewer_tokens:
        return 0.7
    return 0.0


# ---------------------------------------------------------------------------
# State helpers
# ---------------------------------------------------------------------------

async def _get_user_feed_state(db: AsyncSession, user_id: int) -> UserFeedState | None:
    result = await db.execute(
        select(UserFeedState).where(UserFeedState.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def record_dismissed(db: AsyncSession, user_id: int, opportunity_id: int) -> None:
    """Append an opportunity to the user's dismissed list."""
    state = await _get_user_feed_state(db, user_id)
    if state is None:
        state = UserFeedState(user_id=user_id, dismissed_ids=json.dumps([opportunity_id]))
        db.add(state)
    else:
        ids: list[int] = []
        try:
            ids = json.loads(state.dismissed_ids or "[]")
        except (ValueError, TypeError):
            ids = []
        if opportunity_id not in ids:
            ids.append(opportunity_id)
            state.dismissed_ids = json.dumps(ids)
    await db.commit()
