"""
Scoring Engine - TrustRank Weighted Reputation Algorithm

Implements the weighted scoring formula from ratings_plan.md:
Score = Σ(Rating × Weight × Decay) / Σ(Weight × Decay)

Weights:
- Verified Manager: 1.5 (Gold standard)
- Verified Peer: 1.0 (Baseline)
- Verified Direct Report: 0.9 (Subjective bias risk)
- Unverified Connection: 0.3 (Low signal)
- Reciprocal Rating: 0.8 multiplier (If A rates B, B's rating of A is dampened)

Time Decay:
- < 1 year: 1.0
- 1-3 years: 0.85
- > 3 years: 0.7
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
import logging

logger = logging.getLogger(__name__)


# Weight configuration
RELATIONSHIP_WEIGHTS = {
    "manager": 1.5,      # Verified manager - highest trust
    "peer": 1.0,         # Verified peer - baseline
    "report": 0.9,       # Direct report - slight bias risk
    "client": 0.85,      # External client
    "mentor": 0.9,       # Mentor relationship
    "colleague": 1.0,    # General colleague
    "unverified": 0.3,   # Unverified connection - low signal
}

RECIPROCAL_DAMPENING = 0.8  # Applied when mutual ratings within 7 days

# Dimension categories
DIMENSION_CATEGORIES = {
    "technical": ["code_quality", "system_design", "debugging", "technical_depth"],
    "soft_skills": ["communication", "empathy", "collaboration", "mentorship"],
    "execution": ["reliability", "delivery", "ownership", "initiative"],
    "leadership": ["vision", "people_management", "strategic_thinking", "culture"],
}


def get_time_decay(rating_date: datetime) -> float:
    """
    Calculate time decay factor based on rating age.
    
    Returns:
        float: Decay multiplier (0.7 - 1.0)
    """
    if not rating_date:
        return 1.0
    
    age = datetime.utcnow() - rating_date
    years = age.days / 365.25
    
    if years < 1:
        return 1.0
    elif years < 3:
        return 0.85
    else:
        return 0.7


def get_relationship_weight(
    relationship: str,
    is_verified: bool = False,
    is_reciprocal: bool = False
) -> float:
    """
    Get the weight for a rating based on relationship type and verification.
    
    Args:
        relationship: Type of relationship (manager, peer, report, etc.)
        is_verified: Whether the rater's employment is verified
        is_reciprocal: Whether this is a mutual rating (dampening applied)
        
    Returns:
        float: Weight multiplier
    """
    base_weight = RELATIONSHIP_WEIGHTS.get(relationship.lower(), 0.5)
    
    # Apply verification boost/penalty
    if not is_verified:
        base_weight = min(base_weight, RELATIONSHIP_WEIGHTS["unverified"])
    
    # Apply reciprocal dampening
    if is_reciprocal:
        base_weight *= RECIPROCAL_DAMPENING
    
    return base_weight


def calculate_weighted_score(
    ratings: List[Dict],
    dimension: Optional[str] = None
) -> Tuple[float, int]:
    """
    Calculate weighted average score using TrustRank formula.
    
    Args:
        ratings: List of rating dicts with keys:
            - score: float (1-5)
            - relationship: str
            - is_verified: bool
            - is_reciprocal: bool
            - created_at: datetime
            - dimensions: dict (optional)
        dimension: If provided, calculate score for specific dimension only
        
    Returns:
        Tuple of (weighted_score, rating_count)
    """
    if not ratings:
        return (0.0, 0)
    
    weighted_sum = 0.0
    weight_sum = 0.0
    count = 0
    
    for rating in ratings:
        # Get the score (overall or dimension-specific)
        if dimension:
            score = rating.get("dimensions", {}).get(dimension)
            if score is None:
                continue
        else:
            score = rating.get("overall_score") or rating.get("score")
            if score is None:
                continue
        
        # Calculate weight
        weight = get_relationship_weight(
            relationship=rating.get("relationship", "peer"),
            is_verified=rating.get("is_verified", False),
            is_reciprocal=rating.get("is_reciprocal", False)
        )
        
        # Apply time decay
        decay = get_time_decay(rating.get("created_at"))
        
        # Accumulate
        effective_weight = weight * decay
        weighted_sum += score * effective_weight
        weight_sum += effective_weight
        count += 1
    
    if weight_sum == 0:
        return (0.0, 0)
    
    return (round(weighted_sum / weight_sum, 2), count)


def calculate_dimension_scores(ratings: List[Dict]) -> Dict[str, Dict]:
    """
    Calculate scores for each dimension category.
    
    Returns:
        Dict with dimension names as keys, containing:
            - score: float
            - count: int
    """
    dimension_scores = {}
    
    # Collect all dimensions from ratings
    all_dimensions = set()
    for rating in ratings:
        if "dimensions" in rating and rating["dimensions"]:
            all_dimensions.update(rating["dimensions"].keys())
    
    # Calculate score for each dimension
    for dimension in all_dimensions:
        score, count = calculate_weighted_score(ratings, dimension=dimension)
        if count > 0:
            dimension_scores[dimension] = {
                "score": score,
                "count": count
            }
    
    return dimension_scores


def calculate_percentile(score: float, role: str = "general") -> int:
    """
    Calculate percentile ranking based on score.
    
    This is a simplified calculation - in production, we'd query
    actual percentiles from the user_reputation_stats table.
    
    Args:
        score: The user's score (1-5)
        role: Role category for comparison
        
    Returns:
        int: Percentile (1-100)
    """
    # Simplified percentile calculation
    # In production: SELECT PERCENT_RANK() OVER (ORDER BY global_score)
    if score >= 4.8:
        return 95
    elif score >= 4.5:
        return 85
    elif score >= 4.2:
        return 70
    elif score >= 4.0:
        return 50
    elif score >= 3.5:
        return 30
    elif score >= 3.0:
        return 15
    else:
        return 5


def get_trust_signals(
    global_score: float,
    manager_count: int,
    is_verified: bool,
    dimension_scores: Dict
) -> List[str]:
    """
    Generate trust signals/badges based on reputation metrics.
    
    Returns:
        List of signal identifiers
    """
    signals = []
    
    if global_score >= 4.8:
        signals.append("top_rated")
    
    if manager_count >= 3:
        signals.append("manager_endorsed")
    
    if is_verified:
        signals.append("identity_verified")
    
    # Check for exceptional dimension scores
    for dimension, data in dimension_scores.items():
        if data["score"] >= 4.9 and data["count"] >= 3:
            signals.append(f"exceptional_{dimension}")
    
    return signals


def calculate_reputation_stats(db: Session, user_id: int) -> Dict:
    """
    Calculate complete reputation statistics for a user.
    
    Args:
        db: Database session
        user_id: User ID to calculate stats for
        
    Returns:
        Dict with complete reputation stats
    """
    from app.models.rating import Rating
    from app.models.user import User
    from app.models.verification import Verification
    
    # Fetch all ratings for this user
    ratings_query = db.query(Rating).filter(
        Rating.target_id == user_id,
        Rating.visibility == "public"
    ).all()
    
    # Convert to list of dicts for processing
    ratings = []
    for r in ratings_query:
        ratings.append({
            "score": r.overall_score,
            "dimensions": r.dimensions if hasattr(r, 'dimensions') else {},
            "relationship": r.relationship_type if hasattr(r, 'relationship_type') else "peer",
            "is_verified": r.verified_context if hasattr(r, 'verified_context') else False,
            "is_reciprocal": False,  # Would need to check reciprocal ratings
            "created_at": r.created_at
        })
    
    # Calculate scores
    global_score, total_count = calculate_weighted_score(ratings)
    
    # Calculate manager-only score
    manager_ratings = [r for r in ratings if r.get("relationship") == "manager"]
    manager_score, manager_count = calculate_weighted_score(manager_ratings)
    
    # Calculate peer-only score
    peer_ratings = [r for r in ratings if r.get("relationship") in ["peer", "colleague"]]
    peer_score, peer_count = calculate_weighted_score(peer_ratings)
    
    # Calculate dimension scores
    dimension_scores = calculate_dimension_scores(ratings)
    
    # Get percentile
    percentile = calculate_percentile(global_score)
    
    # Check if user is verified
    verification = db.query(Verification).filter(
        Verification.user_id == user_id,
        Verification.verification_type == "identity",
        Verification.status == "verified"
    ).first()
    is_verified = verification is not None
    
    # Generate signals
    signals = get_trust_signals(global_score, manager_count, is_verified, dimension_scores)
    
    return {
        "user_id": user_id,
        "global_score": global_score,
        "percentile": percentile,
        "total_reviews": total_count,
        "manager_score": manager_score,
        "manager_count": manager_count,
        "peer_score": peer_score,
        "peer_count": peer_count,
        "dimension_scores": dimension_scores,
        "signals": signals,
        "is_verified": is_verified,
        "last_updated": datetime.utcnow().isoformat()
    }


def update_user_reputation_stats(db: Session, user_id: int) -> Dict:
    """
    Recalculate and save user reputation stats to the cache table.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Updated stats dict
    """
    from app.models.reputation_stats import UserReputationStats
    
    # Calculate fresh stats
    stats = calculate_reputation_stats(db, user_id)
    
    # Upsert to cache table
    existing = db.query(UserReputationStats).filter(
        UserReputationStats.user_id == user_id
    ).first()
    
    if existing:
        existing.global_score = stats["global_score"]
        existing.total_reviews = stats["total_reviews"]
        existing.manager_score = stats["manager_score"]
        existing.peer_score = stats["peer_score"]
        existing.dimension_scores = stats["dimension_scores"]
        existing.percentile = stats["percentile"]
        existing.signals = stats["signals"]
        existing.last_updated = datetime.utcnow()
    else:
        new_stats = UserReputationStats(
            user_id=user_id,
            global_score=stats["global_score"],
            total_reviews=stats["total_reviews"],
            manager_score=stats["manager_score"],
            peer_score=stats["peer_score"],
            dimension_scores=stats["dimension_scores"],
            percentile=stats["percentile"],
            signals=stats["signals"]
        )
        db.add(new_stats)
    
    db.commit()
    logger.info(f"Updated reputation stats for user {user_id}: {stats['global_score']}")
    
    return stats
