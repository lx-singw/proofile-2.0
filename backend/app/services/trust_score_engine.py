"""
Trust Score Engine - Core Algorithm

This service calculates a user's Trust Score (0-100) based on their verification status.
The algorithm is defined in verification_plan.md Section 10.

Score Breakdown:
- Identity Verified (L3): +30 points
- Phone + Email Verified (fallback): +10 points
- Each Verified Job (L2): +15 points (max 40 points)
- Each Verified Skill (L1): +5 points (max 20 points)
- High Reputation (avg > 4.5): +10 points
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.verification import Verification


def calculate_trust_score(db: Session, user: User) -> int:
    """
    Calculate the Trust Score for a given user.
    
    Args:
        db: Database session
        user: The user object
        
    Returns:
        An integer score from 0 to 100.
    """
    score = 0
    
    # --- Base: Identity (Max 30) ---
    identity_verification = db.query(Verification).filter(
        Verification.user_id == user.id,
        Verification.verification_type == "identity",
        Verification.status == "verified"
    ).first()
    
    if identity_verification:
        score += 30
    else:
        # Fallback: Phone + Email verified
        email_verified = db.query(Verification).filter(
            Verification.user_id == user.id,
            Verification.verification_type == "email",
            Verification.status == "verified"
        ).first()
        phone_verified = db.query(Verification).filter(
            Verification.user_id == user.id,
            Verification.verification_type == "phone",
            Verification.status == "verified"
        ).first()
        if email_verified and phone_verified:
            score += 10
    
    # --- Professional History (Max 40) ---
    verified_jobs = db.query(Verification).filter(
        Verification.user_id == user.id,
        Verification.verification_type == "employment",
        Verification.status == "verified"
    ).count()
    score += min(verified_jobs * 15, 40)  # Cap at 40
    
    # --- Skills (Max 20) ---
    verified_skills = db.query(Verification).filter(
        Verification.user_id == user.id,
        Verification.verification_type == "skills",
        Verification.status == "verified"
    ).count()
    score += min(verified_skills * 5, 20)  # Cap at 20
    
    # --- Reputation (Max 10) ---
    # Integration with ratings system - high reputation adds to trust
    try:
        from app.models.reputation_stats import UserReputationStats
        reputation = db.query(UserReputationStats).filter(
            UserReputationStats.user_id == user.id
        ).first()
        
        if reputation and reputation.global_score >= 4.5:
            score += 10  # High reputation bonus
        elif reputation and reputation.global_score >= 4.0:
            score += 5   # Good reputation bonus
    except Exception:
        pass  # Reputation table may not exist yet
    
    return min(100, score)


def get_trust_level(score: int) -> str:
    """
    Convert a numeric score to a tier label.
    
    Args:
        score: The trust score (0-100)
        
    Returns:
        A tier string: 'low', 'medium', 'high', or 'elite'.
    """
    if score >= 91:
        return "elite"
    elif score >= 71:
        return "high"
    elif score >= 41:
        return "medium"
    else:
        return "low"


def update_user_trust_score(db: Session, user: User) -> int:
    """
    Recalculate and persist the user's trust score.
    
    Args:
        db: Database session
        user: The user object to update
        
    Returns:
        The new trust score.
    """
    new_score = calculate_trust_score(db, user)
    user.trust_score = new_score
    db.add(user)
    db.commit()
    db.refresh(user)
    return new_score
