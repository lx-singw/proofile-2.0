"""
Skill Extractor Service

Extracts skills from job descriptions using the Proofile skill taxonomy.
Maps raw skill mentions to canonical names for consistent tagging.
"""

import json
import re
import logging
from typing import List, Set, Dict, Any, Optional
from pathlib import Path

from app.services.opportunity_normalizer import SKILL_TAXONOMY

logger = logging.getLogger(__name__)


class SkillExtractor:
    """
    Service for extracting and normalizing skills from job descriptions.
    Uses the Proofile skill taxonomy to map raw mentions to canonical names.
    """

    def __init__(self):
        self.taxonomy = SKILL_TAXONOMY.get("categories", {})
        # Pre-compile regex patterns for performance
        self._compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict[str, re.Pattern]:
        """Pre-compile regex patterns for all skills in the taxonomy."""
        patterns = {}
        for category, skills in self.taxonomy.items():
            for canonical, aliases in skills.items():
                # Build pattern that matches any alias with word boundaries
                escaped_aliases = [re.escape(alias) for alias in aliases]
                pattern_str = r'\b(' + '|'.join(escaped_aliases) + r')\b'
                patterns[canonical] = re.compile(pattern_str, re.IGNORECASE)
        return patterns

    def extract_skills(self, description: str) -> List[str]:
        """
        Extract skills from a job description using the taxonomy.
        
        Returns: List of canonical skill names found in the description.
        """
        if not description:
            return []

        found = set()

        # Use pre-compiled patterns for efficient matching
        for canonical, pattern in self._compiled_patterns.items():
            if pattern.search(description):
                found.add(canonical)

        return sorted(list(found))

    def extract_skills_with_context(
        self,
        description: str,
        window_size: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Extract skills with surrounding context for debugging/verification.
        
        Returns: [
            {
                skill: str,
                matched_alias: str,
                context: str,  # text surrounding the match
                position: int,
            }
        ]
        """
        if not description:
            return []

        results = []
        desc_lower = description.lower()

        for category, skills in self.taxonomy.items():
            for canonical, aliases in skills.items():
                for alias in aliases:
                    pattern = rf'\b{re.escape(alias)}\b'
                    for match in re.finditer(pattern, desc_lower, re.IGNORECASE):
                        start = max(0, match.start() - window_size)
                        end = min(len(description), match.end() + window_size)
                        context = description[start:end]

                        results.append({
                            "skill": canonical,
                            "matched_alias": alias,
                            "context": context.strip(),
                            "position": match.start(),
                        })

        # Remove duplicates (same skill found multiple times)
        seen = set()
        unique_results = []
        for r in results:
            if r["skill"] not in seen:
                seen.add(r["skill"])
                unique_results.append(r)

        return unique_results

    def normalize_raw_skills(self, raw_skills: List[str]) -> List[str]:
        """
        Normalize a list of raw skill strings to canonical names.
        
        Input: ["NodeJS", "reactjs", "python 3"]
        Output: ["nodejs", "react", "python"]
        """
        if not raw_skills:
            return []

        normalized = set()

        for raw_skill in raw_skills:
            raw_lower = raw_skill.lower().strip()

            # Direct match in taxonomy
            found = False
            for category, skills in self.taxonomy.items():
                for canonical, aliases in skills.items():
                    if raw_lower == canonical.lower():
                        normalized.add(canonical)
                        found = True
                        break
                    if raw_lower in [a.lower() for a in aliases]:
                        normalized.add(canonical)
                        found = True
                        break
                if found:
                    break

            if not found:
                # No match — keep cleaned original
                cleaned = re.sub(r'[^\w\s]', '', raw_lower).replace(" ", "_")
                if cleaned:
                    normalized.add(cleaned)

        return sorted(list(normalized))

    def get_skill_categories(self, skills: List[str]) -> Dict[str, List[str]]:
        """
        Categorize a list of skills by their taxonomy category.
        
        Returns: {
            "programming_languages": ["python", "javascript"],
            "frameworks_libraries": ["react", "django"],
            ...
        }
        """
        categorized = {}

        for skill in skills:
            for category, category_skills in self.taxonomy.items():
                if skill in category_skills:
                    if category not in categorized:
                        categorized[category] = []
                    categorized[category].append(skill)
                    break

        return categorized

    def suggest_related_skills(self, skills: List[str]) -> List[str]:
        """
        Suggest related skills based on common co-occurrences.
        Simple implementation: suggest skills from same categories.
        """
        if not skills:
            return []

        categorized = self.get_skill_categories(skills)
        suggestions = set()

        # Add other skills from the same categories
        for category, category_skills in categorized.items():
            if category in self.taxonomy:
                all_in_category = list(self.taxonomy[category].keys())
                for skill in all_in_category:
                    if skill not in skills:
                        suggestions.add(skill)

        return sorted(list(suggestions))[:10]  # Limit suggestions

    def extract_experience_years(self, description: str) -> Optional[int]:
        """
        Extract required years of experience from description.
        Looks for patterns like "5+ years", "3-5 years", "minimum 2 years".
        """
        if not description:
            return None

        text = description.lower()

        # Pattern: "X+ years", "X+ yrs", "minimum X years"
        patterns = [
            r'(?:minimum|min|at least)\s*(\d+)\+?\s*(?:years?|yrs?)',
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience',
            r'(\d+)[\s-]+(\d+)\s*(?:years?|yrs?)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                # Take the first match
                match = matches[0]
                if isinstance(match, tuple):
                    # Range like "3-5 years" — take the upper bound
                    return int(match[-1])
                return int(match)

        return None

    def extract_required_degree(self, description: str) -> Optional[str]:
        """
        Extract degree requirements from description.
        """
        if not description:
            return None

        text = description.lower()

        degree_patterns = {
            "bachelors": r'\b(bachelor|b\.sc|bsc|b\.tech|btech|b\.eng|beng|undergraduate)\b',
            "masters": r'\b(master|m\.sc|msc|m\.tech|mtech|mba|m\.eng|meng|postgraduate)\b',
            "phd": r'\b(phd|ph\.d|doctorate|doctoral)\b',
            "diploma": r'\b(diploma|nd|national diploma)\b',
            "certificate": r'\b(certificate|certification|certified)\b',
        }

        for degree, pattern in degree_patterns.items():
            if re.search(pattern, text):
                return degree

        return None

    async def process_opportunity(
        self,
        opportunity: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Process an opportunity dictionary and extract all relevant information.
        
        Input: Raw opportunity dict with description, title, etc.
        Output: Enriched dict with extracted_skills, experience_years, required_degree
        """
        description = opportunity.get("description", "")
        title = opportunity.get("title", "")
        full_text = f"{title} {description}"

        # Extract skills
        skills = self.extract_skills(full_text)

        # Extract experience years
        experience_years = self.extract_experience_years(description)

        # Extract degree requirement
        required_degree = self.extract_required_degree(description)

        # Categorize skills
        categorized = self.get_skill_categories(skills)

        # Suggest related skills
        related = self.suggest_related_skills(skills)

        return {
            **opportunity,
            "extracted_skills": skills,
            "skills_by_category": categorized,
            "experience_years_required": experience_years,
            "required_degree": required_degree,
            "suggested_related_skills": related,
        }

    async def process_batch(
        self,
        opportunities: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Process a batch of opportunities.
        """
        results = []
        for opp in opportunities:
            processed = await self.process_opportunity(opp)
            results.append(processed)
        return results
