"""
Career Insights API - Analytics for reputation growth and market comparison

Endpoints:
- GET /insights/growth - Reputation score over time
- GET /insights/market-comparison - Dimension percentiles vs market
- GET /insights/suggestions - Personalized improvement suggestions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.social import Rating
from app.models.reputation_stats import UserReputationStats
from app.models.rating_dimension import RatingDimension

router = APIRouter(prefix="/insights", tags=["career-insights"])


# ============ Schemas ============

class GrowthDataPoint(BaseModel):
    period: str  # "2024-01", "2024-02", etc.
    score: float
    review_count: int


class GrowthResponse(BaseModel):
    user_id: int
    current_score: float
    change_last_month: float
    change_last_year: float
    data_points: List[GrowthDataPoint]
    milestone: Optional[str]  # "You've improved 0.5 points this year!"


class DimensionPercentile(BaseModel):
    dimension: str
    your_score: float
    market_average: float
    percentile: int  # 1-100
    trend: str  # "improving", "stable", "declining"
    suggestion: Optional[str]


class MarketComparisonResponse(BaseModel):
    user_id: int
    role: Optional[str]
    dimensions: List[DimensionPercentile]
    top_strengths: List[str]  # Top 3 dimensions
    growth_areas: List[str]  # Bottom 3 dimensions


class SuggestionItem(BaseModel):
    title: str
    description: str
    action_type: str  # "verify", "request_rating", "course", "project"
    priority: str  # "high", "medium", "low"
    link: Optional[str]


class SuggestionsResponse(BaseModel):
    suggestions: List[SuggestionItem]


# ============ Endpoints ============

@router.get("/growth", response_model=GrowthResponse)
async def get_reputation_growth(
    months: int = Query(12, ge=3, le=36, description="Number of months of history"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get reputation score growth over time.
    
    Shows monthly averages to visualize career growth trajectory.
    """
    cutoff = datetime.utcnow() - timedelta(days=months * 30)
    
    # Get all ratings over time
    ratings = db.query(Rating).filter(
        Rating.target_id == current_user.id,
        Rating.created_at >= cutoff
    ).order_by(Rating.created_at).all()
    
    # Group by month
    monthly_data = {}
    for rating in ratings:
        month_key = rating.created_at.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"scores": [], "count": 0}
        if rating.overall_score:
            monthly_data[month_key]["scores"].append(rating.overall_score)
            monthly_data[month_key]["count"] += 1
    
    # Calculate running average for each month
    data_points = []
    running_scores = []
    for month in sorted(monthly_data.keys()):
        running_scores.extend(monthly_data[month]["scores"])
        avg = sum(running_scores) / len(running_scores) if running_scores else 0
        data_points.append(GrowthDataPoint(
            period=month,
            score=round(avg, 2),
            review_count=monthly_data[month]["count"]
        ))
    
    # Get current stats
    stats = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == current_user.id
    ).first()
    
    current_score = stats.global_score if stats else 0
    
    # Calculate changes
    change_last_month = 0
    change_last_year = 0
    
    if len(data_points) >= 2:
        change_last_month = round(current_score - data_points[-2].score, 2) if len(data_points) >= 2 else 0
    if len(data_points) >= 12:
        change_last_year = round(current_score - data_points[-12].score, 2)
    
    # Generate milestone message
    milestone = None
    if change_last_year > 0.5:
        milestone = f"🎉 You've improved {change_last_year} points this year! Keep it up!"
    elif change_last_month > 0.1:
        milestone = f"📈 Great month! Your score increased by {change_last_month}."
    elif current_score >= 4.5:
        milestone = "⭐ You're in the elite tier! Top performers trust you."
    
    return GrowthResponse(
        user_id=current_user.id,
        current_score=current_score,
        change_last_month=change_last_month,
        change_last_year=change_last_year,
        data_points=data_points,
        milestone=milestone
    )


@router.get("/market-comparison", response_model=MarketComparisonResponse)
async def get_market_comparison(
    role: Optional[str] = Query(None, description="Role to compare against (e.g., 'Senior Engineer')"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Compare your dimension scores against market averages.
    
    Shows percentile rankings for each skill dimension.
    """
    # Get user's stats
    stats = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == current_user.id
    ).first()
    
    user_dimensions = stats.dimension_scores if stats else {}
    
    # Get market averages for all users (or filtered by role in future)
    all_stats = db.query(UserReputationStats).filter(
        UserReputationStats.total_reviews >= 3  # Only users with enough data
    ).all()
    
    # Calculate market averages per dimension
    dimension_totals = {}
    for s in all_stats:
        if s.dimension_scores:
            for dim, data in s.dimension_scores.items():
                if dim not in dimension_totals:
                    dimension_totals[dim] = []
                score = data.get("score") if isinstance(data, dict) else data
                if score:
                    dimension_totals[dim].append(score)
    
    # Build comparison
    dimensions = []
    for dim, scores in dimension_totals.items():
        market_avg = sum(scores) / len(scores) if scores else 0
        
        # Get user's score for this dimension
        user_data = user_dimensions.get(dim, {})
        user_score = user_data.get("score") if isinstance(user_data, dict) else (user_data or 0)
        
        # Calculate percentile
        if scores and user_score > 0:
            below_count = sum(1 for s in scores if s < user_score)
            percentile = int((below_count / len(scores)) * 100)
        else:
            percentile = 50
        
        # Determine trend (simplified - would use historical data)
        trend = "stable"
        if percentile >= 70:
            trend = "improving"
        elif percentile <= 30:
            trend = "declining"
        
        # Generate suggestion for low scores
        suggestion = None
        if percentile < 40 and user_score < market_avg:
            suggestion = f"Consider requesting more ratings that highlight your {dim.title()} skills."
        
        dimensions.append(DimensionPercentile(
            dimension=dim.title(),
            your_score=round(user_score, 1),
            market_average=round(market_avg, 1),
            percentile=percentile,
            trend=trend,
            suggestion=suggestion
        ))
    
    # Sort by percentile to find strengths and growth areas
    sorted_dims = sorted(dimensions, key=lambda d: d.percentile, reverse=True)
    top_strengths = [d.dimension for d in sorted_dims[:3]] if len(sorted_dims) >= 3 else [d.dimension for d in sorted_dims]
    growth_areas = [d.dimension for d in sorted_dims[-3:]] if len(sorted_dims) >= 3 else []
    
    return MarketComparisonResponse(
        user_id=current_user.id,
        role=role or current_user.persona,
        dimensions=dimensions,
        top_strengths=top_strengths,
        growth_areas=growth_areas
    )


@router.get("/suggestions", response_model=SuggestionsResponse)
async def get_personalized_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get personalized suggestions to improve reputation.
    
    Analyzes gaps and recommends actions.
    """
    suggestions = []
    
    # Get user's stats
    stats = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == current_user.id
    ).first()
    
    total_reviews = stats.total_reviews if stats else 0
    global_score = stats.global_score if stats else 0
    
    # Suggestion: Get more reviews
    if total_reviews < 5:
        suggestions.append(SuggestionItem(
            title="Request More Ratings",
            description=f"You have {total_reviews} reviews. Users with 5+ reviews get 3x more profile views.",
            action_type="request_rating",
            priority="high",
            link="/reputation/request"
        ))
    
    # Suggestion: Get manager rating
    if stats and not stats.manager_score:
        suggestions.append(SuggestionItem(
            title="Get a Manager Rating",
            description="Manager ratings carry 50% more weight. Request a rating from a current or former manager.",
            action_type="request_rating",
            priority="high",
            link="/reputation/request"
        ))
    
    # Suggestion: Verify identity
    # Check if user has identity verification (would check verification table)
    suggestions.append(SuggestionItem(
        title="Verify Your Identity",
        description="Verified users appear higher in search results and get 2x more connection requests.",
        action_type="verify",
        priority="medium",
        link="/dashboard/verification"
    ))
    
    # Suggestion: Improve weak dimensions
    if stats and stats.dimension_scores:
        for dim, data in stats.dimension_scores.items():
            score = data.get("score") if isinstance(data, dict) else data
            if score and score < 3.5:
                suggestions.append(SuggestionItem(
                    title=f"Improve {dim.title()} Score",
                    description=f"Your {dim.title()} score ({score:.1f}) is below average. Consider requesting ratings that highlight this skill.",
                    action_type="request_rating",
                    priority="medium",
                    link="/reputation/request"
                ))
    
    # Suggestion: Maintain momentum
    if global_score >= 4.5 and total_reviews >= 10:
        suggestions.append(SuggestionItem(
            title="Share Your Success",
            description="Your reputation is excellent! Share your public profile to attract opportunities.",
            action_type="project",
            priority="low",
            link=f"/p/{current_user.id}"
        ))
    
    return SuggestionsResponse(suggestions=suggestions[:5])  # Limit to 5 suggestions
