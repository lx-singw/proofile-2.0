"""
Salary Enrichment Service

Estimates missing salary data using market intelligence from existing
opportunities with similar roles, locations, and experience levels.
"""

import logging
from typing import Optional, Dict, Any, List
from statistics import median
from datetime import datetime, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity

logger = logging.getLogger(__name__)


class SalaryEnrichment:
    """
    Service for enriching missing salary data using market intelligence.
    """

    # Minimum number of comparable opportunities needed for estimation
    MIN_COMPARABLES = 3

    # Confidence thresholds
    HIGH_CONFIDENCE_MIN = 5  # 5+ comparables = high confidence
    MEDIUM_CONFIDENCE_MIN = 3  # 3+ comparables = medium confidence

    # Default salary ranges by experience level (ZAR monthly)
    DEFAULT_RANGES = {
        "entry": {"min": 15000, "max": 25000},
        "junior": {"min": 18000, "max": 35000},
        "mid": {"min": 35000, "max": 60000},
        "senior": {"min": 50000, "max": 90000},
        "lead": {"min": 70000, "max": 120000},
        "principal": {"min": 90000, "max": 150000},
        "executive": {"min": 120000, "max": 250000},
    }

    # SA location multipliers (relative to national average)
    LOCATION_MULTIPLIERS = {
        "johannesburg": 1.15,
        "sandton": 1.20,
        "cape town": 1.10,
        "durban": 0.95,
        "pretoria": 1.05,
        "port elizabeth": 0.90,
        "bloemfontein": 0.85,
        "remote": 1.00,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def enrich_salary(
        self,
        opportunity: Opportunity,
    ) -> Optional[Dict[str, Any]]:
        """
        Estimate salary for an opportunity if it's missing.
        
        Strategy:
        1. Find comparable opportunities (same title + location + experience)
        2. If enough comparables, use their median salary
        3. If not enough, use experience level defaults
        4. Apply location multiplier
        
        Returns: {
            min: int,
            max: int,
            confidence: str,  # high | medium | low
            source: str,     # comparable | experience_default
            based_on: int,    # number of comparables used
        } or None if estimation not possible
        """
        # Skip if salary already exists
        if opportunity.salary_min or opportunity.salary_max:
            return None

        # Step 1: Find comparable opportunities
        comparables = await self._find_comparable_salaries(opportunity)

        if len(comparables) >= self.MIN_COMPARABLES:
            # Use median of comparable salaries
            return self._estimate_from_comparables(comparables, len(comparables))

        # Step 2: Fall back to experience level defaults
        return self._estimate_from_defaults(opportunity)

    async def _find_comparable_salaries(
        self,
        opportunity: Opportunity,
    ) -> List[int]:
        """
        Find salary data from comparable opportunities.
        Comparables match on title keywords, location, and experience level.
        """
        if not opportunity.title:
            return []

        # Extract key terms from title (remove common prefixes/suffixes)
        title_terms = self._extract_title_terms(opportunity.title)
        if not title_terms:
            return []

        # Build query: opportunities with salary data, similar title, posted in last 90 days
        since = datetime.utcnow() - timedelta(days=90)

        query = (
            select(Opportunity.salary_min, Opportunity.salary_max)
            .where(Opportunity.id != opportunity.id)
            .where(Opportunity.salary_min.is_not(None))
            .where(Opportunity.posted_at >= since)
            .where(Opportunity.is_active == True)
            .limit(50)
        )

        # Filter by location if available
        if opportunity.city:
            query = query.where(
                func.lower(Opportunity.location).like(f"%{opportunity.city.lower()}%")
            )
        elif opportunity.province:
            query = query.where(
                func.lower(Opportunity.location).like(f"%{opportunity.province.lower()}%")
            )

        result = await self.db.execute(query)
        rows = result.all()

        # Filter by title similarity (in Python for flexibility)
        salaries = []
        for row in rows:
            salary_min, salary_max = row
            if salary_min and salary_max:
                salaries.append((salary_min + salary_max) // 2)
            elif salary_min:
                salaries.append(salary_min)
            elif salary_max:
                salaries.append(salary_max)

        return salaries

    def _extract_title_terms(self, title: str) -> List[str]:
        """Extract meaningful terms from a job title."""
        # Remove common prefixes
        clean = title.lower()
        prefixes = [
            "senior", "junior", "mid", "lead", "principal", "staff",
            "associate", "head of", "director of", "vp of",
            "entry level", "entry-level", "graduate", "intern",
            "remote", "hybrid", "onsite",
        ]
        for prefix in prefixes:
            clean = clean.replace(prefix, "")

        # Extract remaining meaningful words
        words = re.findall(r'\b[a-z]{3,}\b', clean)
        return words

    def _estimate_from_comparables(
        self,
        salaries: List[int],
        count: int,
    ) -> Dict[str, Any]:
        """Estimate salary from comparable opportunities."""
        if not salaries:
            return None

        med = median(salaries)
        
        # Calculate range: +/- 20% of median
        salary_min = int(med * 0.80)
        salary_max = int(med * 1.20)

        # Round to nearest 1,000
        salary_min = (salary_min // 1000) * 1000
        salary_max = (salary_max // 1000) * 1000

        confidence = "high" if count >= self.HIGH_CONFIDENCE_MIN else "medium"

        return {
            "min": salary_min,
            "max": salary_max,
            "confidence": confidence,
            "source": "comparable",
            "based_on": count,
        }

    def _estimate_from_defaults(
        self,
        opportunity: Opportunity,
    ) -> Optional[Dict[str, Any]]:
        """Estimate salary from experience level defaults."""
        # Map experience level to default range
        level = self._detect_experience_level(opportunity)
        default = self.DEFAULT_RANGES.get(level)

        if not default:
            return None

        # Apply location multiplier
        multiplier = 1.0
        location_key = (opportunity.city or "").lower()
        if location_key in self.LOCATION_MULTIPLIERS:
            multiplier = self.LOCATION_MULTIPLIERS[location_key]
        elif opportunity.province:
            province_lower = opportunity.province.lower()
            for city, mult in self.LOCATION_MULTIPLIERS.items():
                if city in province_lower:
                    multiplier = mult
                    break

        salary_min = int(default["min"] * multiplier)
        salary_max = int(default["max"] * multiplier)

        # Round to nearest 1,000
        salary_min = (salary_min // 1000) * 1000
        salary_max = (salary_max // 1000) * 1000

        return {
            "min": salary_min,
            "max": salary_max,
            "confidence": "low",
            "source": "experience_default",
            "based_on": 0,
        }

    def _detect_experience_level(self, opportunity: Opportunity) -> str:
        """Detect experience level from title and description."""
        text = f"{opportunity.title or ''} {opportunity.experience_level or ''}".lower()

        # Check for explicit experience level
        if "executive" in text or "cto" in text or "ceo" in text or "chief" in text:
            return "executive"
        if "principal" in text or "director" in text or "head of" in text:
            return "principal"
        if "lead" in text or "team lead" in text:
            return "lead"
        if "senior" in text or "sr." in text or "sr " in text or "5+ years" in text or "5-8 years" in text:
            return "senior"
        if "mid" in text or "intermediate" in text or "2-5 years" in text:
            return "mid"
        if "junior" in text or "jr." in text or "jr " in text or "entry" in text or "1-2 years" in text:
            return "junior"
        if "intern" in text or "graduate" in text or "0-1 years" in text or "no experience" in text:
            return "entry"

        # Default based on description length and complexity
        if opportunity.description and len(opportunity.description) > 500:
            return "mid"  # More detailed descriptions often = mid-level

        return "mid"  # Default assumption

    async def enrich_batch(
        self,
        opportunities: List[Opportunity],
    ) -> Dict[str, Any]:
        """
        Enrich salaries for a batch of opportunities.
        
        Returns: {enriched, skipped, stats_by_confidence}
        """
        enriched = 0
        skipped = 0
        confidence_counts = {"high": 0, "medium": 0, "low": 0}

        for opp in opportunities:
            result = await self.enrich_salary(opp)

            if result:
                opp.salary_min = result["min"]
                opp.salary_max = result["max"]
                opp.salary_visible = True
                # Store enrichment metadata in description or a note field
                # For now, we'll log it
                confidence_counts[result["confidence"]] += 1
                enriched += 1
            else:
                skipped += 1

        return {
            "enriched": enriched,
            "skipped": skipped,
            "confidence": confidence_counts,
        }

    async def run_enrichment_for_source(
        self,
        source: str,
        since: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Run salary enrichment for all opportunities from a specific source.
        
        Returns: {processed, enriched, skipped, confidence}
        """
        if not since:
            since = datetime.utcnow() - timedelta(days=7)

        query = (
            select(Opportunity)
            .where(Opportunity.source == source)
            .where(Opportunity.created_at >= since)
            .where(Opportunity.salary_min.is_(None))
            .where(Opportunity.salary_max.is_(None))
            .where(Opportunity.is_active == True)
        )

        result = await self.db.execute(query)
        opportunities = result.scalars().all()

        if not opportunities:
            return {"processed": 0, "enriched": 0, "skipped": 0, "confidence": {}}

        stats = await self.enrich_batch(opportunities)
        await self.db.commit()

        logger.info(
            f"Salary enrichment for {source}: {stats['enriched']} enriched, "
            f"{stats['skipped']} skipped, "
            f"confidence: {stats['confidence']}"
        )

        return {
            "processed": len(opportunities),
            "enriched": stats["enriched"],
            "skipped": stats["skipped"],
            "confidence": stats["confidence"],
        }
