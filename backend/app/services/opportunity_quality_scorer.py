"""
Opportunity Quality Scorer

Calculates a 0-1 quality score for each opportunity based on data completeness,
source reliability, and spam detection. Listings below a threshold are filtered
from the feed but retained for analytics.
"""

import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.opportunity import Opportunity

logger = logging.getLogger(__name__)


class OpportunityQualityScorer:
    """
    Service for scoring and filtering opportunity quality.
    """

    # Minimum score to appear in feed
    MINIMUM_FEED_SCORE = 0.40

    # Spam detection thresholds
    SPAM_INDICATORS = [
        # Generic titles that don't describe actual roles
        r'^\s*(make money|earn money|work from home|easy money|get rich)',
        r'^\s*(no experience needed|no skills required|immediate start|urgent)',
        # Excessive capitalization
        r'^[^a-z]{10,}$',
        # URL patterns in titles
        r'http[s]?://',
        # Pyramid scheme indicators
        r'\b(mlm|multi.?level|pyramid|referral.?bonus|downline)\b',
        # Generic work-from-home spam
        r'\b(data entry clerk|data entry specialist|email processor)\b',
    ]

    # Weighted scoring components
    WEIGHTS = {
        "has_company": 0.15,
        "has_title": 0.15,
        "has_location": 0.10,
        "has_salary": 0.20,
        "has_description": 0.15,
        "has_skills": 0.10,
        "has_application_url": 0.05,
        "has_dates": 0.05,
        "source_reliability": 0.05,
    }

    # Source reliability scores (0-1)
    SOURCE_RELIABILITY = {
        "direct": 1.0,
        "offerzen": 0.95,
        "pnet": 0.90,
        "careers24": 0.85,
        "careerjunction": 0.85,
        "indeed": 0.80,
        "linkedin": 0.80,
        "glassdoor": 0.75,
        "recentjobs": 0.70,
        "studentroom": 0.65,
        "yes4youth": 0.70,
        "unknown": 0.50,
    }

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db

    def calculate_quality_score(self, opportunity: Opportunity) -> float:
        """
        Calculate a 0-1 quality score for an opportunity.
        
        Components:
        - has_company (15%): Company name present and meaningful
        - has_title (15%): Title present and descriptive
        - has_location (10%): Location specified
        - has_salary (20%): Salary data present (high signal value)
        - has_description (15%): Description > 100 chars
        - has_skills (10%): Required skills specified
        - has_application_url (5%): How to apply is clear
        - has_dates (5%): Posted/expires dates present
        - source_reliability (5%): Source trustworthiness
        
        Returns: Score between 0 and 1
        """
        if not opportunity:
            return 0.0

        score = 0.0

        # 1. Has company name (15%)
        if opportunity.company_name and len(opportunity.company_name) > 1:
            score += self.WEIGHTS["has_company"]

        # 2. Has title (15%)
        if opportunity.title and len(opportunity.title) > 3:
            score += self.WEIGHTS["has_title"]

        # 3. Has location (10%)
        if opportunity.location and len(opportunity.location) > 2:
            score += self.WEIGHTS["has_location"]

        # 4. Has salary (20%)
        if opportunity.salary_min or opportunity.salary_max:
            score += self.WEIGHTS["has_salary"]

        # 5. Has description (15%)
        desc = opportunity.description or ""
        if len(desc) > 100:
            score += self.WEIGHTS["has_description"]
        elif len(desc) > 50:
            score += self.WEIGHTS["has_description"] * 0.5

        # 6. Has skills (10%)
        if opportunity.required_skills and len(opportunity.required_skills) > 0:
            score += self.WEIGHTS["has_skills"]

        # 7. Has application URL (5%)
        if opportunity.application_url:
            score += self.WEIGHTS["has_application_url"]

        # 8. Has dates (5%)
        if opportunity.posted_at or opportunity.expires_at:
            score += self.WEIGHTS["has_dates"]

        # 9. Source reliability (5%)
        source = (opportunity.source or "unknown").lower()
        reliability = self.SOURCE_RELIABILITY.get(source, 0.50)
        score += self.WEIGHTS["source_reliability"] * reliability

        return round(score, 3)

    def detect_spam(self, opportunity: Opportunity) -> Dict[str, Any]:
        """
        Detect spam indicators in an opportunity.
        
        Returns: {
            is_spam: bool,
            reasons: List[str],
            confidence: float,  # 0-1
        }
        """
        reasons = []
        indicators = 0
        total_checks = 0

        title = (opportunity.title or "").lower()
        description = (opportunity.description or "").lower()
        company = (opportunity.company_name or "").lower()
        text = f"{title} {description} {company}"

        # Check spam patterns
        for pattern in self.SPAM_INDICATORS:
            total_checks += 1
            if re.search(pattern, text, re.IGNORECASE):
                reasons.append(f"Matched spam pattern: {pattern[:50]}...")
                indicators += 1

        # Check for suspicious URL patterns in company name
        total_checks += 1
        if re.search(r'http[s]?://', company):
            reasons.append("Company name contains URL")
            indicators += 1

        # Check for excessive special characters in title
        total_checks += 1
        special_chars = len(re.findall(r'[^\w\s]', title))
        if special_chars > len(title) * 0.3:
            reasons.append("Excessive special characters in title")
            indicators += 1

        # Check for missing critical fields
        total_checks += 1
        if not opportunity.company_name or not opportunity.title:
            reasons.append("Missing critical fields (company or title)")
            indicators += 1

        # Check for very short descriptions
        total_checks += 1
        if len(description) < 50 and not opportunity.salary_min:
            reasons.append("Very short description with no salary")
            indicators += 1

        # Calculate confidence
        confidence = indicators / total_checks if total_checks > 0 else 0.0
        is_spam = confidence >= 0.5 or indicators >= 3

        return {
            "is_spam": is_spam,
            "reasons": reasons,
            "confidence": round(confidence, 2),
        }

    def is_expired(self, opportunity: Opportunity) -> bool:
        """
        Check if an opportunity is expired (older than 30 days).
        """
        if opportunity.expires_at:
            return opportunity.expires_at < datetime.utcnow()

        if opportunity.posted_at:
            age = datetime.utcnow() - opportunity.posted_at
            return age > timedelta(days=30)

        # If no dates at all, assume not expired (could be evergreen)
        return False

    def should_show_in_feed(self, opportunity: Opportunity) -> bool:
        """
        Determine if an opportunity should be shown in the feed.
        Combines quality score, spam detection, and expiry check.
        """
        # Must meet minimum quality score
        score = self.calculate_quality_score(opportunity)
        if score < self.MINIMUM_FEED_SCORE:
            return False

        # Must not be spam
        spam_check = self.detect_spam(opportunity)
        if spam_check["is_spam"]:
            return False

        # Must not be expired
        if self.is_expired(opportunity):
            return False

        # Must have company and title
        if not opportunity.company_name or not opportunity.title:
            return False

        return True

    async def score_opportunities_batch(
        self,
        opportunities: List[Opportunity],
    ) -> Dict[str, Any]:
        """
        Score a batch of opportunities and categorize them.
        
        Returns: {
            total: int,
            scored: int,
            feed_eligible: int,
            spam_detected: int,
            expired: int,
            low_quality: int,
        }
        """
        stats = {
            "total": len(opportunities),
            "scored": 0,
            "feed_eligible": 0,
            "spam_detected": 0,
            "expired": 0,
            "low_quality": 0,
        }

        for opp in opportunities:
            # Calculate quality score
            score = self.calculate_quality_score(opp)
            opp.quality_score = score
            stats["scored"] += 1

            # Check spam
            spam_check = self.detect_spam(opp)
            if spam_check["is_spam"]:
                stats["spam_detected"] += 1
                opp.is_active = False
                opp.ai_status = "spam_detected"
                continue

            # Check expiry
            if self.is_expired(opp):
                stats["expired"] += 1
                opp.is_active = False
                continue

            # Check quality threshold
            if score < self.MINIMUM_FEED_SCORE:
                stats["low_quality"] += 1
                opp.is_active = False
                continue

            # Feed eligible
            stats["feed_eligible"] += 1
            opp.is_active = True

        return stats

    async def run_quality_scoring_for_source(
        self,
        source: str,
        since: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Run quality scoring for all opportunities from a specific source.
        Useful after a scraper run.
        
        Returns: {total, scored, feed_eligible, spam_detected, expired, low_quality}
        """
        if not self.db:
            raise ValueError("Database session required for batch scoring")

        if not since:
            since = datetime.utcnow() - timedelta(days=7)

        query = (
            select(Opportunity)
            .where(Opportunity.source == source)
            .where(Opportunity.created_at >= since)
            .where(Opportunity.quality_score == 0.5)  # Default unscored
        )

        result = await self.db.execute(query)
        opportunities = result.scalars().all()

        if not opportunities:
            return {"total": 0, "scored": 0, "feed_eligible": 0, "spam_detected": 0, "expired": 0, "low_quality": 0}

        stats = await self.score_opportunities_batch(opportunities)
        await self.db.commit()

        logger.info(
            f"Quality scoring for {source}: {stats['total']} processed, "
            f"{stats['feed_eligible']} feed-eligible, "
            f"{stats['spam_detected']} spam, "
            f"{stats['expired']} expired, "
            f"{stats['low_quality']} low quality"
        )

        return stats
