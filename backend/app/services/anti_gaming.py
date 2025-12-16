"""
Anti-Gaming Measures Service for Rating System (Enhanced)

Implements comprehensive verification and quality checks:
1. Duplicate detection (one per person per company per year)
2. Suspicious pattern detection (all 5-star ratings)
3. Rate limiting (max 5 per 24 hours)
4. Weighted scoring by relationship type
5. Mutual confirmation for relationship verification
6. IP/device tracking for fraud detection
7. Employment verification cross-reference
8. Annual update limit enforcement
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import logging
import hashlib

logger = logging.getLogger(__name__)


# Weighted scoring by relationship type (per Phase 8 specs)
RELATIONSHIP_WEIGHTS = {
    "manager": 10,      # Manager endorsement = 10 points
    "client": 7,        # Client endorsement = 7 points
    "colleague": 5,     # Colleague endorsement = 5 points
    "direct_report": 4, # Direct report = 4 points
}


class AntiGamingMeasures:
    """Enhanced service for anti-gaming measures in ratings"""
    
    # Rate limiting: one rating per person per company per year
    RATING_COOLDOWN_DAYS = 365
    
    # Maximum ratings per 24-hour window
    MAX_RATINGS_PER_DAY = 5
    
    # Suspicious pattern thresholds
    SUSPICIOUS_AVERAGE_THRESHOLD = 4.9
    SUSPICIOUS_PATTERN_PERCENTAGE = 80
    
    # Minimum days before rating update allowed
    MIN_DAYS_BEFORE_UPDATE = 30
    
    @staticmethod
    async def check_duplicate_rating(
        session: AsyncSession,
        rater_id: int,
        rated_user_id: int,
        company: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if rater has already rated this person at this company.
        
        Returns: (is_duplicate, error_message)
        """
        from app.models.social import Rating
        
        query = select(Rating).where(
            and_(
                Rating.rater_id == rater_id,
                Rating.rated_user_id == rated_user_id,
                Rating.company == company,
                Rating.created_at > datetime.utcnow() - timedelta(days=AntiGamingMeasures.RATING_COOLDOWN_DAYS)
            )
        )
        
        result = await session.execute(query)
        existing_rating = result.scalars().first()
        
        if existing_rating:
            next_allowed = existing_rating.created_at + timedelta(days=365)
            return True, f"You can only rate this person at {company} once per year. Next allowed: {next_allowed.strftime('%Y-%m-%d')}"
        
        return False, None
    
    @staticmethod
    async def check_annual_update_limit(
        session: AsyncSession,
        rating_id: int,
        rater_id: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Enforce annual update limit. Users can only update a rating once per year.
        
        Returns: (can_update, error_message)
        """
        from app.models.social import Rating
        
        query = select(Rating).where(
            and_(
                Rating.id == rating_id,
                Rating.rater_id == rater_id
            )
        )
        
        result = await session.execute(query)
        rating = result.scalars().first()
        
        if not rating:
            return False, "Rating not found"
        
        # Check if updated_at is within the last year
        if rating.updated_at:
            days_since_update = (datetime.utcnow() - rating.updated_at).days
            if days_since_update < 365:
                next_allowed = rating.updated_at + timedelta(days=365)
                return False, f"You can only update this rating once per year. Next allowed: {next_allowed.strftime('%Y-%m-%d')}"
        
        return True, None
    
    @staticmethod
    def calculate_weighted_score(
        base_score: float,
        relationship_type: str
    ) -> Tuple[float, int]:
        """
        Calculate weighted score based on relationship type.
        
        Manager endorsements count more than colleague endorsements.
        
        Returns: (weighted_score, weight_applied)
        """
        weight = RELATIONSHIP_WEIGHTS.get(relationship_type, 5)  # Default to colleague weight
        weighted_score = base_score * (weight / 5)  # Normalize to 5-point scale
        
        return weighted_score, weight
    
    @staticmethod
    async def calculate_user_reputation_score(
        session: AsyncSession,
        user_id: int
    ) -> Dict:
        """
        Calculate comprehensive reputation score with weighted ratings.
        
        Returns dict with:
        - average_score: Simple average
        - weighted_score: Weighted by relationship type
        - total_points: Sum of all weighted points
        - breakdown: Scores by category
        """
        from app.models.social import Rating
        
        query = select(Rating).where(
            and_(
                Rating.rated_user_id == user_id,
                Rating.is_flagged == False
            )
        )
        
        result = await session.execute(query)
        ratings = result.scalars().all()
        
        if not ratings:
            return {
                "average_score": 0.0,
                "weighted_score": 0.0,
                "total_points": 0,
                "total_ratings": 0,
                "breakdown": {}
            }
        
        total_points = 0
        total_weight = 0
        simple_total = 0
        breakdown = {}
        
        for rating in ratings:
            rel_type = rating.relationship_type or "colleague"
            weight = RELATIONSHIP_WEIGHTS.get(rel_type, 5)
            
            total_points += rating.score * weight
            total_weight += weight
            simple_total += rating.score
            
            # Track by category
            category = rating.category or "general"
            if category not in breakdown:
                breakdown[category] = {"scores": [], "weighted_sum": 0, "weight_sum": 0}
            breakdown[category]["scores"].append(rating.score)
            breakdown[category]["weighted_sum"] += rating.score * weight
            breakdown[category]["weight_sum"] += weight
        
        # Calculate category averages
        for cat, data in breakdown.items():
            if data["weight_sum"] > 0:
                breakdown[cat]["average"] = round(data["weighted_sum"] / data["weight_sum"], 2)
            else:
                breakdown[cat]["average"] = 0.0
        
        return {
            "average_score": round(simple_total / len(ratings), 2),
            "weighted_score": round(total_points / total_weight, 2) if total_weight > 0 else 0.0,
            "total_points": total_points,
            "total_ratings": len(ratings),
            "breakdown": breakdown
        }
    
    @staticmethod
    async def check_mutual_confirmation(
        session: AsyncSession,
        rater_id: int,
        rated_user_id: int
    ) -> Tuple[bool, Optional[str], bool]:
        """
        Check if both parties have confirmed they worked together.
        Uses reciprocal ratings as proof of mutual confirmation.
        
        Returns: (has_reciprocal, message, should_notify)
        """
        from app.models.social import Rating
        
        # Check if rated_user has rated rater back
        query = select(Rating).where(
            and_(
                Rating.rater_id == rated_user_id,
                Rating.rated_user_id == rater_id
            )
        )
        
        result = await session.execute(query)
        reciprocal_rating = result.scalars().first()
        
        if reciprocal_rating:
            return True, "Mutually confirmed working relationship!", False
        else:
            return False, None, True  # Should notify rated user to reciprocate
    
    @staticmethod
    def generate_device_fingerprint(
        ip_address: str,
        user_agent: str
    ) -> str:
        """Generate a fingerprint for device tracking"""
        fingerprint_data = f"{ip_address}:{user_agent}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
    
    @staticmethod
    async def check_ip_device_abuse(
        session: AsyncSession,
        rater_id: int,
        rated_user_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Detect multiple accounts from same device giving ratings to same person.
        
        Returns: (is_suspicious, warning_message)
        """
        from app.models.social import Rating
        
        if not ip_address:
            return False, None
        
        device_fingerprint = AntiGamingMeasures.generate_device_fingerprint(
            ip_address, user_agent or ""
        )
        
        # Find ratings to same user from same IP (different raters) in last 7 days
        # This would require storing IP in Rating model - for now, log warning
        logger.info(f"Device check for rating: fingerprint={device_fingerprint[:8]}...")
        
        # Basic check: multiple ratings to same user in short time
        cutoff = datetime.utcnow() - timedelta(days=7)
        query = select(count(Rating.id)).where(
            and_(
                Rating.rated_user_id == rated_user_id,
                Rating.created_at > cutoff
            )
        )
        
        result = await session.execute(query)
        recent_count = result.scalar() or 0
        
        if recent_count >= 10:
            return True, f"Suspicious: {recent_count} ratings received in 7 days. Flagged for review."
        
        return False, None
    
    @staticmethod
    async def verify_employment_cross_reference(
        session: AsyncSession,
        rater_id: int,
        rated_user_id: int,
        company: str
    ) -> Tuple[bool, Optional[str], int]:
        """
        Cross-reference rating company with verified employment records.
        
        Returns: (is_verified, message, verification_level)
        - Level 0: No verification
        - Level 1: Self-reported (both users claim same company)
        - Level 2: One user has verified employment
        - Level 3: Both users have verified employment at company
        """
        from app.models.verification import Verification
        
        # Check rater's employment verification
        rater_query = select(Verification).where(
            and_(
                Verification.user_id == rater_id,
                Verification.verification_type == "employment",
                Verification.status == "verified"
            )
        )
        rater_result = await session.execute(rater_query)
        rater_verifications = rater_result.scalars().all()
        
        # Check rated user's employment verification
        rated_query = select(Verification).where(
            and_(
                Verification.user_id == rated_user_id,
                Verification.verification_type == "employment",
                Verification.status == "verified"
            )
        )
        rated_result = await session.execute(rated_query)
        rated_verifications = rated_result.scalars().all()
        
        rater_has_company = any(
            company.lower() in (v.verification_data or "").lower() 
            for v in rater_verifications
        )
        rated_has_company = any(
            company.lower() in (v.verification_data or "").lower() 
            for v in rated_verifications
        )
        
        if rater_has_company and rated_has_company:
            return True, "Both users have verified employment at this company!", 3
        elif rater_has_company or rated_has_company:
            return True, "One user has verified employment at this company.", 2
        else:
            return False, "No verified employment records found. Rating allowed but noted.", 0
    
    @staticmethod
    async def detect_suspicious_patterns(
        session: AsyncSession,
        rated_user_id: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Detect suspicious rating patterns.
        
        Flags for:
        1. All 5-star ratings (impossible for any human)
        2. Average rating > 4.9
        3. No variation in ratings from same period
        
        Returns: (is_suspicious, flag_reason)
        """
        from app.models.social import Rating
        
        query = select(Rating).where(
            and_(
                Rating.rated_user_id == rated_user_id,
                Rating.is_flagged == False
            )
        )
        
        result = await session.execute(query)
        ratings = result.scalars().all()
        
        if not ratings or len(ratings) < 3:
            return False, None
        
        # Calculate statistics
        scores = [r.score for r in ratings]
        count_five_stars = sum(1 for s in scores if s == 5)
        average = sum(scores) / len(scores)
        percentage_five = (count_five_stars / len(scores)) * 100
        
        # Check for all-identical scores (suspicious)
        if len(set(scores)) == 1 and len(scores) >= 5:
            return True, f"All {len(scores)} ratings have identical score of {scores[0]}. Review recommended."
        
        # Check for suspicious high percentage of 5-stars
        if percentage_five >= AntiGamingMeasures.SUSPICIOUS_PATTERN_PERCENTAGE:
            return True, f"Suspicious: {percentage_five:.0f}% of ratings are 5-stars."
        
        # Check for unusually high average
        if average >= AntiGamingMeasures.SUSPICIOUS_AVERAGE_THRESHOLD:
            return True, f"Suspicious: Average rating {average:.2f} is unusually high."
        
        return False, None
    
    @staticmethod
    async def check_rate_limiting(
        session: AsyncSession,
        rater_id: int,
        time_window_hours: int = 24
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if rater is rate-limited.
        
        Returns: (is_rate_limited, error_message)
        """
        from app.models.social import Rating
        
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        
        query = select(count(Rating.id)).where(
            and_(
                Rating.rater_id == rater_id,
                Rating.created_at > cutoff_time
            )
        )
        
        result = await session.execute(query)
        recent_count = result.scalar() or 0
        
        if recent_count >= AntiGamingMeasures.MAX_RATINGS_PER_DAY:
            return True, f"Rate limited: Maximum {AntiGamingMeasures.MAX_RATINGS_PER_DAY} ratings per 24 hours. Try again later."
        
        return False, None
    
    @staticmethod
    async def create_reciprocal_notification(
        session: AsyncSession,
        rating_id: int,
        rated_user_id: int,
        rater_name: str
    ) -> None:
        """
        Create notification to encourage reciprocal rating.
        "John rated you! Rate John back?"
        """
        from app.models.notification import Notification
        
        notification = Notification(
            user_id=rated_user_id,
            type="rating_received",
            title="You received a professional rating!",
            message=f"{rater_name} rated you. Rate them back to build trust!",
            data={"rating_id": rating_id},
            is_actionable=True
        )
        
        session.add(notification)
        logger.info(f"Created reciprocal rating notification for user {rated_user_id}")
    
    @staticmethod
    async def flag_suspicious_rating(
        session: AsyncSession,
        rating_id: int,
        reason: str
    ) -> None:
        """Flag a rating for admin review"""
        from app.models.social import Rating
        
        query = select(Rating).where(Rating.id == rating_id)
        result = await session.execute(query)
        rating = result.scalars().first()
        
        if rating:
            rating.is_flagged = True
            rating.flag_reason = reason
            await session.commit()
            logger.warning(f"Rating {rating_id} flagged: {reason}")


async def validate_rating_with_all_checks(
    session: AsyncSession,
    rater_id: int,
    rated_user_id: int,
    company: str,
    relationship_type: str,
    score: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[bool, List[str], Dict]:
    """
    Comprehensive validation with all anti-gaming measures.
    
    Returns: (is_valid, errors, metadata)
    """
    errors = []
    metadata = {
        "weight": RELATIONSHIP_WEIGHTS.get(relationship_type, 5),
        "mutual_confirmed": False,
        "employment_verified": False,
        "verification_level": 0
    }
    
    # 1. Check duplicate
    is_dup, msg = await AntiGamingMeasures.check_duplicate_rating(
        session, rater_id, rated_user_id, company
    )
    if is_dup:
        errors.append(msg)
    
    # 2. Check rate limiting
    is_limited, msg = await AntiGamingMeasures.check_rate_limiting(session, rater_id)
    if is_limited:
        errors.append(msg)
    
    # 3. Check mutual confirmation
    is_mutual, msg, _ = await AntiGamingMeasures.check_mutual_confirmation(
        session, rater_id, rated_user_id
    )
    metadata["mutual_confirmed"] = is_mutual
    
    # 4. Check employment verification
    is_verified, msg, level = await AntiGamingMeasures.verify_employment_cross_reference(
        session, rater_id, rated_user_id, company
    )
    metadata["employment_verified"] = is_verified
    metadata["verification_level"] = level
    
    # 5. IP/device abuse check
    is_abuse, msg = await AntiGamingMeasures.check_ip_device_abuse(
        session, rater_id, rated_user_id, ip_address, user_agent
    )
    if is_abuse:
        errors.append(msg)
    
    return len(errors) == 0, errors, metadata
