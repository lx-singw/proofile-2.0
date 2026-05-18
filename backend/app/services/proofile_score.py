"""
Proofile Score — The PageRank for People (MVP v1)

Transparent formula from PRD Section 3.3:

    Proofile Score =
      (avg_star_rating × 30%)
      + (verified_review_count, capped at 20, normalised × 25%)
      + (avg_reviewer_seniority_score × 25%)
      + (profile_completeness × 10%)
      + (cross_platform_bonus × 10%)

Score range: 0–100
Recalculated after every review submission.
Stored on users.trust_score.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.verified_review import VerifiedReview, ReviewStatus
from app.models.profile import Profile

logger = logging.getLogger(__name__)


async def recalculate_proofile_score(db: AsyncSession, user_id: int) -> int:
    """
    Recalculate and persist the Proofile Score for a user.

    Returns the new score (0–100).
    """
    # 1. Fetch all published reviews for this user
    reviews_result = await db.execute(
        select(VerifiedReview).where(
            VerifiedReview.reviewee_id == user_id,
            VerifiedReview.status == ReviewStatus.PUBLISHED.value,
            VerifiedReview.is_flagged == False,
        )
    )
    reviews = reviews_result.scalars().all()

    review_count = len(reviews)

    if review_count == 0:
        # No reviews = base score from profile completeness only
        completeness = await _get_profile_completeness(db, user_id)
        cross_platform = await _get_cross_platform_bonus(db, user_id)
        score = int(completeness * 10 + cross_platform * 10)
        await _save_score(db, user_id, max(0, min(100, score)))
        return max(0, min(100, score))

    # 2. Average star rating (0–5 → normalised to 0–100)
    avg_rating = sum(r.star_rating for r in reviews if r.star_rating) / review_count
    star_component = (avg_rating / 5.0) * 100 * 0.30

    # 3. Review count (capped at 20, normalised)
    capped_count = min(review_count, 20)
    count_component = (capped_count / 20.0) * 100 * 0.25

    # 4. Average reviewer seniority (0–10 → normalised to 0–100)
    avg_seniority = sum(r.reviewer_seniority_score or 4.0 for r in reviews) / review_count
    seniority_component = (avg_seniority / 10.0) * 100 * 0.25

    # 5. Profile completeness (0–1)
    completeness = await _get_profile_completeness(db, user_id)
    completeness_component = completeness * 100 * 0.10

    # 6. Cross-platform bonus (0–1)
    cross_platform = await _get_cross_platform_bonus(db, user_id)
    cross_platform_component = cross_platform * 100 * 0.10

    total = (
        star_component
        + count_component
        + seniority_component
        + completeness_component
        + cross_platform_component
    )
    score = max(0, min(100, int(round(total))))

    await _save_score(db, user_id, score)

    logger.info(
        f"Proofile Score recalculated for user {user_id}: {score} "
        f"(stars={star_component:.1f}, count={count_component:.1f}, "
        f"seniority={seniority_component:.1f}, completeness={completeness_component:.1f}, "
        f"cross_platform={cross_platform_component:.1f})"
    )

    return score


async def get_score_breakdown(db: AsyncSession, user_id: int) -> dict:
    """Get the full breakdown of how the score is calculated."""
    reviews_result = await db.execute(
        select(VerifiedReview).where(
            VerifiedReview.reviewee_id == user_id,
            VerifiedReview.status == ReviewStatus.PUBLISHED.value,
            VerifiedReview.is_flagged == False,
        )
    )
    reviews = reviews_result.scalars().all()
    review_count = len(reviews)

    if review_count == 0:
        completeness = await _get_profile_completeness(db, user_id)
        cross_platform = await _get_cross_platform_bonus(db, user_id)
        return {
            "total_score": int(completeness * 10 + cross_platform * 10),
            "avg_star_rating": 0.0,
            "star_rating_component": 0.0,
            "review_count": 0,
            "review_count_component": 0.0,
            "avg_seniority": 0.0,
            "seniority_component": 0.0,
            "profile_completeness": completeness,
            "completeness_component": completeness * 10,
            "cross_platform_bonus": cross_platform,
            "cross_platform_component": cross_platform * 10,
        }

    avg_rating = sum(r.star_rating for r in reviews if r.star_rating) / review_count
    capped_count = min(review_count, 20)
    avg_seniority = sum(r.reviewer_seniority_score or 4.0 for r in reviews) / review_count
    completeness = await _get_profile_completeness(db, user_id)
    cross_platform = await _get_cross_platform_bonus(db, user_id)

    star_comp = (avg_rating / 5.0) * 100 * 0.30
    count_comp = (capped_count / 20.0) * 100 * 0.25
    seniority_comp = (avg_seniority / 10.0) * 100 * 0.25
    completeness_comp = completeness * 100 * 0.10
    cross_platform_comp = cross_platform * 100 * 0.10

    total = star_comp + count_comp + seniority_comp + completeness_comp + cross_platform_comp

    return {
        "total_score": max(0, min(100, int(round(total)))),
        "avg_star_rating": round(avg_rating, 2),
        "star_rating_component": round(star_comp, 1),
        "review_count": review_count,
        "review_count_component": round(count_comp, 1),
        "avg_seniority": round(avg_seniority, 2),
        "seniority_component": round(seniority_comp, 1),
        "profile_completeness": round(completeness, 2),
        "completeness_component": round(completeness_comp, 1),
        "cross_platform_bonus": round(cross_platform, 2),
        "cross_platform_component": round(cross_platform_comp, 1),
    }


async def _get_profile_completeness(db: AsyncSession, user_id: int) -> float:
    """Calculate profile completeness as a 0–1 ratio."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return 0.0

    fields_filled = 0
    total_fields = 8

    if user.full_name:
        fields_filled += 1
    if user.bio:
        fields_filled += 1
    if user.profile_photo_url:
        fields_filled += 1
    if user.city:
        fields_filled += 1
    if user.industry:
        fields_filled += 1
    if user.username:
        fields_filled += 1

    # Check profile headline
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if profile and profile.headline:
        fields_filled += 1
    if profile and profile.skills_data and len(profile.skills_data) > 0:
        fields_filled += 1

    return fields_filled / total_fields


async def _get_cross_platform_bonus(db: AsyncSession, user_id: int) -> float:
    """Calculate cross-platform signal bonus as a 0–1 ratio."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return 0.0

    bonus = 0.0
    # GitHub URL present = 0.5 bonus
    github_url = getattr(user, 'profile_photo_url', None)  # Check for github field
    # Use data_sources or direct URL fields
    from app.models.profile_data_source import ProfileDataSource
    sources_result = await db.execute(
        select(ProfileDataSource).where(ProfileDataSource.user_id == user_id)
    )
    sources = sources_result.scalars().all()

    for source in sources:
        if 'github' in (source.source_type or '').lower():
            bonus += 0.5
        if 'linkedin' in (source.source_type or '').lower():
            bonus += 0.5

    return min(1.0, bonus)


async def _save_score(db: AsyncSession, user_id: int, score: int) -> None:
    """Persist the score to the user record."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.trust_score = score
        db.add(user)
        await db.commit()
