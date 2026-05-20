"""
Insight Card Generator — real data-backed feed card payloads.

Generates the 4 non-opportunity card types for the Proofile feed:
  - trust_insight: percentile / review nudge for the current user
  - market_intelligence: real salary aggregations + remote hiring counts from DB
  - community_proof: live interest signal counts from FeedSignal table
  - graph_discovery: companies where user's verified reviewers have worked
"""
from __future__ import annotations

import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import FeedSignal
from app.models.reputation_stats import UserReputationStats

if TYPE_CHECKING:
    from app.models.user import User

logger = logging.getLogger(__name__)


def _card_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# ── Trust Insight Cards ──────────────────────────────────────────────────────

async def generate_trust_insight_cards(user: "User | None", db: AsyncSession) -> list[dict]:
    if user is None:
        return [
            {
                "type": "trust_insight",
                "id": _card_id("trust"),
                "headline": "Verified profiles get hired 3× faster",
                "body": (
                    "Professionals with verified skills on Proofile are contacted by "
                    "recruiters 3× more often than unverified applicants."
                ),
                "cta_label": "Get verified →",
                "cta_href": "/signup",
                "icon_key": "star",
            }
        ]

    rep_result = await db.execute(
        select(UserReputationStats).where(UserReputationStats.user_id == user.id)
    )
    rep = rep_result.scalar_one_or_none()

    if rep and rep.percentile and rep.percentile > 0:
        pct = rep.percentile
        top = 100 - pct
        level = rep.get_level() if hasattr(rep, "get_level") else "professional"
        return [
            {
                "type": "trust_insight",
                "id": _card_id("trust"),
                "headline": f"You rank in the top {top}% of professionals on Proofile",
                "body": (
                    f"Your {level.capitalize()} reputation score puts you ahead of {pct}% "
                    "of professionals on Proofile. Recruiters can see this."
                ),
                "cta_label": "View your full profile",
                "cta_href": "/profile",
                "icon_key": "star",
            }
        ]

    # User has no stats yet — nudge to get first review
    return [
        {
            "type": "trust_insight",
            "id": _card_id("trust"),
            "headline": "One review changes everything",
            "body": (
                "A single verified review from a manager or colleague unlocks your real "
                "match strength on every card in this feed."
            ),
            "cta_label": "Request your first review →",
            "cta_href": "/profile#reviews",
            "icon_key": "star",
        }
    ]


# ── Market Intelligence Cards ─────────────────────────────────────────────────

async def generate_market_intelligence_cards(db: AsyncSession) -> list[dict]:
    cards: list[dict] = []
    cutoff_90d = datetime.now(timezone.utc) - timedelta(days=90)
    cutoff_30d = datetime.now(timezone.utc) - timedelta(days=30)

    # Avg salary by experience level
    try:
        salary_rows = await db.execute(
            text("""
                SELECT experience_level,
                       AVG((salary_min + salary_max) / 2.0) AS avg_salary,
                       COUNT(*) AS cnt
                FROM opportunities
                WHERE salary_min IS NOT NULL
                  AND salary_max IS NOT NULL
                  AND created_at > :cutoff
                GROUP BY experience_level
                ORDER BY avg_salary DESC
                LIMIT 3
            """),
            {"cutoff": cutoff_90d},
        )
        rows = salary_rows.fetchall()
        if rows:
            top = rows[0]
            level = (top.experience_level or "mid-level").replace("_", " ").capitalize()
            avg = int(top.avg_salary or 0)
            if avg > 0:
                cards.append(
                    {
                        "type": "market_intelligence",
                        "id": _card_id("market"),
                        "headline": f"Average {level} salary in SA right now: R{avg:,}/month",
                        "body": (
                            f"Based on {int(top.cnt)} active listings in the last 90 days. "
                            "Verified Proofile profiles get through screening 3× faster."
                        ),
                        "cta_label": None,
                        "cta_href": None,
                        "icon_key": "market",
                    }
                )
    except Exception:
        logger.debug("Salary aggregation query failed — using fallback", exc_info=True)

    # Remote/hybrid count this month
    try:
        remote_result = await db.execute(
            text("""
                SELECT COUNT(*) AS cnt
                FROM opportunities
                WHERE remote_type IN ('remote', 'hybrid', 'flexible')
                  AND is_active = TRUE
                  AND created_at > :cutoff
            """),
            {"cutoff": cutoff_30d},
        )
        remote_cnt = int(remote_result.scalar_one() or 0)
        if remote_cnt > 0:
            cards.append(
                {
                    "type": "market_intelligence",
                    "id": _card_id("market"),
                    "headline": f"{remote_cnt:,} remote-friendly roles active in SA this month",
                    "body": (
                        "South African companies are increasingly open to hybrid and "
                        "remote work. Verified profiles unlock direct contact."
                    ),
                    "cta_label": "Browse remote roles",
                    "cta_href": "/?remote=true",
                    "icon_key": "market",
                }
            )
    except Exception:
        logger.debug("Remote count query failed — using fallback", exc_info=True)

    # Fallback if DB returned nothing
    if not cards:
        cards.append(
            {
                "type": "market_intelligence",
                "id": _card_id("market"),
                "headline": "SA tech salaries are rising — are you keeping up?",
                "body": (
                    "Senior developer roles in Johannesburg pay an average of R80,000/month. "
                    "Verified Proofile profiles get through initial screening 3× faster."
                ),
                "cta_label": None,
                "cta_href": None,
                "icon_key": "market",
            }
        )

    return cards


# ── Community Proof Cards ─────────────────────────────────────────────────────

async def generate_community_proof_cards(db: AsyncSession) -> list[dict]:
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    try:
        count_result = await db.execute(
            select(func.count(func.distinct(FeedSignal.session_id))).where(
                FeedSignal.signal_type == "interest",
                FeedSignal.timestamp >= week_ago,
            )
        )
        count = int(count_result.scalar_one() or 0)
    except Exception:
        count = 0

    if count > 0:
        return [
            {
                "type": "community_proof",
                "id": _card_id("community"),
                "headline": f"{count:,} SA professionals expressed interest this week",
                "body": (
                    "Every week, verified Proofile members match with real opportunities "
                    "— and recruiters reach out to the verified ones first."
                ),
                "cta_label": None,
                "cta_href": None,
                "icon_key": "community",
            }
        ]

    # Fallback
    return [
        {
            "type": "community_proof",
            "id": _card_id("community"),
            "headline": "SA developers are moving up without degrees",
            "body": (
                "Proofile members with 4+ verified reviews are landing senior roles "
                "based on proof — not paper qualifications."
            ),
            "cta_label": None,
            "cta_href": None,
            "icon_key": "community",
        }
    ]


# ── Graph Discovery Cards ─────────────────────────────────────────────────────

async def generate_graph_discovery_cards(user: "User | None", db: AsyncSession) -> list[dict]:
    if user is None:
        return [
            {
                "type": "graph_discovery",
                "id": _card_id("graph"),
                "headline": "Your network is already inside these companies",
                "body": (
                    "Proofile users with your profile type have connections at companies "
                    "currently hiring. Sign in to see who you know."
                ),
                "cta_label": "Sign in to see your network →",
                "cta_href": "/login",
                "icon_key": "network",
            }
        ]

    try:
        # Find companies where user's reviewers have worked + those companies are actively hiring
        rows = await db.execute(
            text("""
                SELECT DISTINCT o.company_name
                FROM verified_reviews vr
                JOIN work_experiences we ON we.user_id = vr.reviewer_proofile_id
                JOIN opportunities o
                  ON LOWER(TRIM(o.company_name)) = LOWER(TRIM(we.company))
                WHERE vr.reviewee_id = :user_id
                  AND vr.status = 'published'
                  AND vr.reviewer_proofile_id IS NOT NULL
                  AND o.is_active = TRUE
                LIMIT 3
            """),
            {"user_id": user.id},
        )
        companies = [row[0] for row in rows.fetchall()]

        if companies:
            company_list = ", ".join(companies[:2])
            suffix = f" and {len(companies) - 2} more" if len(companies) > 2 else ""
            return [
                {
                    "type": "graph_discovery",
                    "id": _card_id("graph"),
                    "headline": "Companies your reviewers work at are hiring",
                    "body": (
                        f"{company_list}{suffix} — companies where your verified reviewers "
                        "have worked — are actively posting roles right now."
                    ),
                    "cta_label": "View your profile",
                    "cta_href": "/profile",
                    "icon_key": "network",
                }
            ]
    except Exception:
        logger.debug("Graph discovery query failed", exc_info=True)

    # Logged in but no graph connections yet
    return [
        {
            "type": "graph_discovery",
            "id": _card_id("graph"),
            "headline": "Build your verified network",
            "body": (
                "Every review you receive adds an edge to your professional graph. "
                "With 3+ reviews, Proofile can show you which companies your reviewers work at."
            ),
            "cta_label": "Request a review →",
            "cta_href": "/profile#reviews",
            "icon_key": "network",
        }
    ]
