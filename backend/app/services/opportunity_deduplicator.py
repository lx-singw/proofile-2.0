"""
Opportunity Deduplicator

Detects and merges duplicate opportunities across multiple scraper sources.
Uses fuzzy matching on company name, title, and location with configurable thresholds.
"""

import logging
from typing import List, Optional, Dict, Any
from difflib import SequenceMatcher
from datetime import datetime, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity

logger = logging.getLogger(__name__)


class OpportunityDeduplicator:
    """
    Service for detecting and merging duplicate opportunities.
    """

    # Matching thresholds (0-1 scale)
    COMPANY_MATCH_THRESHOLD = 0.85
    TITLE_MATCH_THRESHOLD = 0.80
    LOCATION_MATCH_THRESHOLD = 0.90
    MAX_POSTING_AGE_DIFF_DAYS = 14

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_duplicates(
        self,
        opportunity: Opportunity,
        limit: int = 10,
    ) -> List[Opportunity]:
        """
        Find potential duplicate opportunities for a given opportunity.
        
        Uses fuzzy matching on:
        - Company name (>= 85% similarity)
        - Job title (>= 80% similarity)
        - Location (>= 90% similarity or same city)
        - Posted within 14 days of each other
        
        Returns: List of potential duplicate Opportunity objects
        """
        if not opportunity.company_name or not opportunity.title:
            return []

        # Build base query — same general timeframe
        min_date = (opportunity.posted_at or opportunity.created_at) - timedelta(days=self.MAX_POSTING_AGE_DIFF_DAYS)
        max_date = (opportunity.posted_at or opportunity.created_at) + timedelta(days=self.MAX_POSTING_AGE_DIFF_DAYS)

        query = (
            select(Opportunity)
            .where(Opportunity.id != opportunity.id)
            .where(Opportunity.posted_at >= min_date)
            .where(Opportunity.posted_at <= max_date)
            .limit(limit * 3)  # Fetch more for fuzzy filtering
        )

        result = await self.db.execute(query)
        candidates = result.scalars().all()

        duplicates = []
        for candidate in candidates:
            if self._is_duplicate(opportunity, candidate):
                duplicates.append(candidate)
                if len(duplicates) >= limit:
                    break

        if duplicates:
            logger.info(
                f"Found {len(duplicates)} potential duplicates for opportunity "
                f"{opportunity.id} ({opportunity.title[:50]}...)"
            )

        return duplicates

    def _is_duplicate(self, a: Opportunity, b: Opportunity) -> bool:
        """
        Check if two opportunities are duplicates using fuzzy matching.
        """
        # Must have company names to compare
        if not a.company_name or not b.company_name:
            return False

        # Company name similarity
        company_sim = self._fuzzy_similarity(
            a.company_name.lower(),
            b.company_name.lower(),
        )
        if company_sim < self.COMPANY_MATCH_THRESHOLD:
            return False

        # Title similarity
        title_sim = self._fuzzy_similarity(
            a.title.lower(),
            b.title.lower(),
        )
        if title_sim < self.TITLE_MATCH_THRESHOLD:
            return False

        # Location similarity (optional but weighted)
        if a.location and b.location:
            loc_sim = self._fuzzy_similarity(
                a.location.lower(),
                b.location.lower(),
            )
            if loc_sim < self.LOCATION_MATCH_THRESHOLD:
                return False

        return True

    @staticmethod
    def _fuzzy_similarity(a: str, b: str) -> float:
        """
        Calculate fuzzy string similarity using SequenceMatcher.
        Returns a value between 0 and 1.
        """
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a, b).ratio()

    async def merge_duplicates(
        self,
        opportunities: List[Opportunity],
    ) -> Opportunity:
        """
        Merge a group of duplicate opportunities into a single best version.
        
        Preference order:
        1. Direct postings over aggregated (is_direct=True)
        2. Opportunities with salary data
        3. Most complete description
        4. Most recent posting
        5. Highest quality score
        
        Returns: The merged (best) opportunity. Others are marked as duplicates.
        """
        if not opportunities:
            raise ValueError("No opportunities to merge")

        if len(opportunities) == 1:
            return opportunities[0]

        # Score each opportunity to find the "best" one
        def score_opp(opp: Opportunity) -> tuple:
            return (
                int(opp.is_direct or False),                    # Direct preferred
                int(bool(opp.salary_min or opp.salary_max)),    # Has salary
                len(opp.description or ""),                       # Longer description
                opp.posted_at.timestamp() if opp.posted_at else 0,  # Most recent
                opp.quality_score or 0.0,                         # Higher quality
            )

        # Sort by score (highest first)
        sorted_opps = sorted(opportunities, key=score_opp, reverse=True)
        best = sorted_opps[0]

        # Merge data from other opportunities into the best one
        for opp in sorted_opps[1:]:
            best = self._merge_two(best, opp)

        # Mark others as duplicates of the best
        for opp in sorted_opps[1:]:
            opp.is_duplicate_of = best.id
            opp.quality_score = 0.0  # Hide from feed
            opp.is_active = False

        logger.info(
            f"Merged {len(opportunities)} duplicates into opportunity {best.id}"
        )

        return best

    def _merge_two(self, primary: Opportunity, secondary: Opportunity) -> Opportunity:
        """
        Merge data from secondary into primary, preferring primary's data
        but filling gaps from secondary.
        """
        # Fill missing salary from secondary
        if not primary.salary_min and not primary.salary_max:
            if secondary.salary_min:
                primary.salary_min = secondary.salary_min
            if secondary.salary_max:
                primary.salary_max = secondary.salary_max
            if secondary.salary_visible is not None:
                primary.salary_visible = secondary.salary_visible

        # Fill missing description (prefer longer)
        if not primary.description or len(secondary.description or "") > len(primary.description):
            primary.description = secondary.description

        # Fill missing skills
        if not primary.required_skills and secondary.required_skills:
            primary.required_skills = secondary.required_skills

        # Fill missing application URL
        if not primary.application_url and secondary.application_url:
            primary.application_url = secondary.application_url

        # Fill missing remote type
        if not primary.remote_type and secondary.remote_type:
            primary.remote_type = secondary.remote_type

        # Fill missing experience level
        if not primary.experience_level and secondary.experience_level:
            primary.experience_level = secondary.experience_level

        # Fill missing industry
        if not primary.industry and secondary.industry:
            primary.industry = secondary.industry

        # Combine source info
        if secondary.source and secondary.source != primary.source:
            # Keep the more reliable source, but note the secondary
            if not primary.source_platform:
                primary.source_platform = secondary.source

        # Update posted_at to earliest (original posting)
        if secondary.posted_at and primary.posted_at:
            if secondary.posted_at < primary.posted_at:
                primary.posted_at = secondary.posted_at
        elif secondary.posted_at and not primary.posted_at:
            primary.posted_at = secondary.posted_at

        return primary

    async def deduplicate_batch(
        self,
        opportunities: List[Opportunity],
    ) -> List[Opportunity]:
        """
        Deduplicate a batch of opportunities.
        
        For each opportunity, find duplicates and merge them.
        Returns the list of unique (merged) opportunities.
        """
        if not opportunities:
            return []

        processed_ids = set()
        unique_opportunities = []

        for opp in opportunities:
            if opp.id in processed_ids:
                continue

            # Find duplicates
            duplicates = await self.find_duplicates(opp)

            if duplicates:
                # Include the original in the merge
                all_dups = [opp] + duplicates
                merged = await self.merge_duplicates(all_dups)

                # Mark all as processed
                for o in all_dups:
                    processed_ids.add(o.id)

                unique_opportunities.append(merged)
            else:
                processed_ids.add(opp.id)
                unique_opportunities.append(opp)

        logger.info(
            f"Deduplication: {len(opportunities)} raw → {len(unique_opportunities)} unique"
        )

        return unique_opportunities

    async def run_deduplication_for_source(
        self,
        source: str,
        since: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Run deduplication for all opportunities from a specific source.
        Useful after a scraper run.
        
        Returns: {processed, duplicates_found, unique_remaining}
        """
        if not since:
            since = datetime.utcnow() - timedelta(days=7)

        query = (
            select(Opportunity)
            .where(Opportunity.source == source)
            .where(Opportunity.created_at >= since)
            .where(Opportunity.is_active == True)
            .where(Opportunity.is_duplicate_of.is_(None))
        )

        result = await self.db.execute(query)
        opportunities = result.scalars().all()

        if not opportunities:
            return {"processed": 0, "duplicates_found": 0, "unique_remaining": 0}

        unique = await self.deduplicate_batch(opportunities)

        # Commit changes
        await self.db.commit()

        duplicates_found = len(opportunities) - len(unique)

        return {
            "processed": len(opportunities),
            "duplicates_found": duplicates_found,
            "unique_remaining": len(unique),
        }
