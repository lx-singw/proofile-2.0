"""
Rating Stats API - Aggregation and analytics endpoints

Provides:
- Global stats
- Leaderboards
- Trend analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_current_user_optional as get_optional_current_user
from app.models.user import User
from app.models.social import Rating
from app.models.reputation_stats import UserReputationStats

router = APIRouter(prefix="/stats", tags=["rating-stats"])


class DimensionStat(BaseModel):
    name: str
    score: float
    count: int
    percentile: Optional[int] = None


class ReputationSummary(BaseModel):
    user_id: int
    global_score: float
    percentile: int
    total_reviews: int
    verified_count: int
    manager_score: Optional[float] = None
    peer_score: Optional[float] = None
    dimensions: List[DimensionStat]
    signals: List[str]
    level: str
    trend: Optional[float] = None  # Change from last month


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    user_name: str
    score: float
    review_count: int
    badge: Optional[str] = None


@router.get("/summary/{user_id}", response_model=ReputationSummary)
async def get_user_reputation_summary(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get full reputation summary for a user.
    Public data is visible to everyone; private insights require authentication.
    """
    # Get cached stats
    stats = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == user_id
    ).first()
    
    if not stats:
        # Calculate on-the-fly
        stats = await calculate_user_stats(db, user_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build response
    dimensions = []
    if stats.dimension_scores:
        for name, data in stats.dimension_scores.items():
            dimensions.append(DimensionStat(
                name=name,
                score=data.get("score", 0) if isinstance(data, dict) else data,
                count=data.get("count", 0) if isinstance(data, dict) else 1,
            ))
    
    signals = []
    if stats.global_score >= 4.8:
        signals.append("top_rated")
    if stats.total_reviews >= 10:
        signals.append("established")
    if stats.verified_count and stats.verified_count >= 5:
        signals.append("verified_network")
    
    level = get_level(stats.global_score)
    
    return ReputationSummary(
        user_id=user_id,
        global_score=stats.global_score or 0,
        percentile=stats.percentile or 50,
        total_reviews=stats.total_reviews or 0,
        verified_count=stats.verified_count or 0,
        manager_score=stats.manager_score,
        peer_score=stats.peer_score,
        dimensions=dimensions,
        signals=signals,
        level=level,
        trend=None,  # TODO: Calculate from snapshots
    )


@router.get("/leaderboard")
async def get_leaderboard(
    role: Optional[str] = Query(None, description="Filter by role"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """
    Get reputation leaderboard.
    """
    query = db.query(UserReputationStats).filter(
        UserReputationStats.global_score.isnot(None),
        UserReputationStats.total_reviews >= 3  # Minimum reviews to qualify
    )
    
    results = query.order_by(desc(UserReputationStats.global_score)).limit(limit).all()
    
    leaderboard = []
    for idx, stats in enumerate(results, start=1):
        user = db.query(User).filter(User.id == stats.user_id).first()
        if user:
            leaderboard.append(LeaderboardEntry(
                rank=idx,
                user_id=stats.user_id,
                user_name=user.full_name or "Anonymous",
                score=stats.global_score or 0,
                review_count=stats.total_reviews or 0,
                badge=get_badge(stats.global_score),
            ))
    
    return {"leaderboard": leaderboard, "total": len(leaderboard)}


@router.get("/global")
async def get_global_stats(db: Session = Depends(get_db)):
    """
    Get platform-wide reputation statistics.
    """
    total_users = db.query(func.count(UserReputationStats.user_id)).scalar() or 0
    total_reviews = db.query(func.sum(UserReputationStats.total_reviews)).scalar() or 0
    avg_score = db.query(func.avg(UserReputationStats.global_score)).scalar() or 0
    
    # Distribution
    score_buckets = {
        "5_star": 0,
        "4_star": 0,
        "3_star": 0,
        "2_star": 0,
        "1_star": 0,
    }
    
    all_stats = db.query(UserReputationStats).all()
    for s in all_stats:
        if s.global_score is None:
            continue
        if s.global_score >= 4.5:
            score_buckets["5_star"] += 1
        elif s.global_score >= 3.5:
            score_buckets["4_star"] += 1
        elif s.global_score >= 2.5:
            score_buckets["3_star"] += 1
        elif s.global_score >= 1.5:
            score_buckets["2_star"] += 1
        else:
            score_buckets["1_star"] += 1
    
    return {
        "total_users_with_reputation": total_users,
        "total_reviews": total_reviews,
        "average_score": round(avg_score, 2),
        "distribution": score_buckets,
    }


@router.get("/trends/{user_id}")
async def get_user_trends(
    user_id: int,
    months: int = Query(6, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get reputation trend over time (requires authentication).
    """
    # Check authorization
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Can only view your own trends")
    
    # Get ratings over time
    cutoff = datetime.utcnow() - timedelta(days=months * 30)
    
    ratings = db.query(Rating).filter(
        Rating.target_id == user_id,
        Rating.created_at >= cutoff
    ).order_by(Rating.created_at).all()
    
    # Group by month
    monthly_data = {}
    for rating in ratings:
        month_key = rating.created_at.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"scores": [], "count": 0}
        monthly_data[month_key]["scores"].append(rating.overall_score)
        monthly_data[month_key]["count"] += 1
    
    # Calculate monthly averages
    trend_data = []
    for month, data in sorted(monthly_data.items()):
        avg = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
        trend_data.append({
            "month": month,
            "average_score": round(avg, 2),
            "review_count": data["count"],
        })
    
    return {"trends": trend_data}


# Helper functions

def get_level(score: Optional[float]) -> str:
    if score is None:
        return "newcomer"
    if score >= 4.8:
        return "elite"
    if score >= 4.5:
        return "exceptional"
    if score >= 4.0:
        return "trusted"
    if score >= 3.0:
        return "established"
    return "emerging"


def get_badge(score: Optional[float]) -> Optional[str]:
    if score is None:
        return None
    if score >= 4.9:
        return "platinum"
    if score >= 4.5:
        return "gold"
    if score >= 4.0:
        return "silver"
    return None


async def calculate_user_stats(db: Session, user_id: int) -> Optional[UserReputationStats]:
    """Calculate stats on-the-fly if not cached."""
    ratings = db.query(Rating).filter(
        Rating.target_id == user_id,
        Rating.visibility == "public"
    ).all()
    
    if not ratings:
        return None
    
    total = len(ratings)
    scores = [r.overall_score for r in ratings if r.overall_score]
    avg_score = sum(scores) / len(scores) if scores else 0
    
    # Create temporary stats object
    stats = UserReputationStats(
        user_id=user_id,
        global_score=avg_score,
        total_reviews=total,
        verified_count=sum(1 for r in ratings if r.verified_context),
    )
    
    return stats
