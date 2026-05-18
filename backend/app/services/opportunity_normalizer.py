"""
Opportunity Normalizer

Standardizes raw scraped data into a consistent format for the feed pipeline.
Handles job titles, locations, salaries, company names, and dates.
"""

import re
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Load skill taxonomy for normalization
SKILL_TAXONOMY_PATH = Path(__file__).parent.parent / "data" / "skill_taxonomy.json"


def _load_skill_taxonomy() -> Dict[str, Any]:
    """Load the canonical skill taxonomy from JSON."""
    try:
        with open(SKILL_TAXONOMY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning(f"Could not load skill taxonomy: {e}")
        return {"categories": {}}


SKILL_TAXONOMY = _load_skill_taxonomy()


class OpportunityNormalizer:
    """
    Normalizes raw scraped opportunity data to standard Proofile format.
    """

    # Common title normalization patterns
    TITLE_PREFIXES = [
        "senior", "junior", "mid", "lead", "principal", "staff",
        "associate", "head of", "director of", "vp of", "vice president of",
        "entry level", "entry-level", "graduate", "intern", "contract",
        "part-time", "part time", "full-time", "full time", "remote",
        "freelance", "consultant", "interim", "executive", "chief",
    ]

    TITLE_SUFFIXES = [
        "i", "ii", "iii", "iv", "v", "1", "2", "3", "4", "5",
        "level 1", "level 2", "level 3", "level i", "level ii",
    ]

    # SA location mappings
    SA_PROVINCES = {
        "gauteng": ["gauteng", "gauteng province", "gp"],
        "western cape": ["western cape", "wc"],
        "kwazulu-natal": ["kwazulu-natal", "kwazulu natal", "kzn"],
        "eastern cape": ["eastern cape", "ec"],
        "free state": ["free state", "fs"],
        "mpumalanga": ["mpumalanga"],
        "limpopo": ["limpopo"],
        "north west": ["north west", "north-west", "nw"],
        "northern cape": ["northern cape"],
    }

    SA_CITIES = {
        "johannesburg": ["johannesburg", "jhb", "joburg", "jozi"],
        "cape town": ["cape town", "capetown", "ct"],
        "durban": ["durban"],
        "pretoria": ["pretoria", "pta", "tshwane"],
        "port elizabeth": ["port elizabeth", "pe", "gqeberha"],
        "bloemfontein": ["bloemfontein"],
        "nelspruit": ["nelspruit", "mbombela"],
        "polokwane": ["polokwane"],
        "kimberley": ["kimberley"],
        "rustenburg": ["rustenburg"],
        "east london": ["east london"],
        "pietermaritzburg": ["pietermaritzburg"],
        "sandton": ["sandton"],
        "midrand": ["midrand"],
        "rosebank": ["rosebank"],
        "randburg": ["randburg"],
        "centurion": ["centurion"],
        "fourways": ["fourways"],
        "bryanston": ["bryanston"],
    }

    def normalize_title(self, raw_title: str) -> str:
        """
        Standardize job titles.
        - Remove excessive whitespace
        - Capitalize properly
        - Extract level prefix (Senior, Junior, etc.)
        """
        if not raw_title:
            return ""

        title = raw_title.strip()

        # Remove extra whitespace
        title = re.sub(r'\s+', ' ', title)

        # Remove common suffixes (I, II, III, Level 1, etc.)
        for suffix in self.TITLE_SUFFIXES:
            pattern = rf'\b{re.escape(suffix)}\b$'
            title = re.sub(pattern, '', title, flags=re.IGNORECASE).strip()

        # Normalize spacing around dashes
        title = re.sub(r'\s*-\s*', ' - ', title)

        # Capitalize each word properly
        title = title.title()

        # Fix common acronyms that should be uppercase
        acronyms = ["Devops", "Ios", "Android", "Ui", "Ux", "Api", "Sql", "Nosql", "Sre", "Cto", "Cio", "Cfo", "Ceo", "Cmo"]
        for acronym in acronyms:
            title = re.sub(rf'\b{acronym}\b', acronym.upper(), title, flags=re.IGNORECASE)

        # Fix "Sa" -> "SA"
        title = re.sub(r'\bSa\b', 'SA', title)

        return title.strip()

    def normalize_company(self, raw_company: str) -> str:
        """
        Standardize company names.
        - Remove excessive whitespace
        - Title case
        - Remove common suffixes for matching
        """
        if not raw_company:
            return ""

        company = raw_company.strip()
        company = re.sub(r'\s+', ' ', company)

        # Remove common legal suffixes for display (but keep in DB for matching)
        legal_suffixes = [
            r'\b(Pty)\s*(Ltd|Limited)',
            r'\bLtd\.?$',
            r'\bLimited$',
            r'\bInc\.?$',
            r'\bCorp\.?$',
            r'\bCorporation$',
            r'\bLLC$',
            r'\bPLC$',
        ]

        display = company
        for suffix in legal_suffixes:
            display = re.sub(suffix, '', display, flags=re.IGNORECASE).strip()

        # If removing suffixes leaves nothing, use original
        if not display:
            display = company

        return display.title().strip()

    def normalize_location(self, raw_location: str) -> Dict[str, Any]:
        """
        Parse location string into structured components.
        Returns: {city, province, country, remote_type, display}
        """
        if not raw_location:
            return {
                "city": None,
                "province": None,
                "country": "South Africa",
                "remote_type": None,
                "display": None,
            }

        location = raw_location.lower().strip()
        result = {
            "city": None,
            "province": None,
            "country": "South Africa",
            "remote_type": None,
            "display": raw_location.strip(),
        }

        # Detect remote type first
        remote_patterns = {
            "remote": ["remote", "work from home", "wfh", "fully remote", "100% remote"],
            "hybrid": ["hybrid", "partially remote", "flexible"],
            "onsite": ["on-site", "onsite", "on site", "in-office", "in office", "office based"],
        }

        for rtype, patterns in remote_patterns.items():
            for pattern in patterns:
                if pattern in location:
                    result["remote_type"] = rtype
                    location = location.replace(pattern, "").strip(", ")
                    break

        # Detect province
        for province, aliases in self.SA_PROVINCES.items():
            for alias in aliases:
                if alias in location:
                    result["province"] = province.title()
                    location = location.replace(alias, "").strip(", ")
                    break

        # Detect city
        for city, aliases in self.SA_CITIES.items():
            for alias in aliases:
                if alias in location:
                    result["city"] = city.title()
                    location = location.replace(alias, "").strip(", ")
                    break

        # Clean up remaining location text
        location = re.sub(r'[,\s]+', ' ', location).strip()
        if location and not result["city"]:
            # Use remaining text as city if no city matched
            result["city"] = location.title()

        # Build display string
        parts = [p for p in [result["city"], result["province"]] if p]
        if parts:
            result["display"] = ", ".join(parts)
            if result["remote_type"]:
                result["display"] += f" · {result['remote_type'].title()}"
        elif result["remote_type"]:
            result["display"] = result["remote_type"].title()

        return result

    def normalize_salary(self, raw_salary: Optional[str], salary_min: Optional[int] = None, salary_max: Optional[int] = None) -> Dict[str, Any]:
        """
        Parse salary text into structured components.
        Returns: {min, max, currency, period, display, visible}
        """
        result = {
            "min": salary_min,
            "max": salary_max,
            "currency": "ZAR",
            "period": "monthly",
            "display": None,
            "visible": True,
        }

        if not raw_salary and not salary_min and not salary_max:
            result["visible"] = False
            result["display"] = "Competitive — enquire"
            return result

        # If we already have numeric values, use them
        if salary_min or salary_max:
            result["min"] = salary_min
            result["max"] = salary_max
            result["display"] = self._format_salary_display(salary_min, salary_max)
            return result

        # Parse salary text
        text = raw_salary.lower().strip()

        # Extract numbers
        numbers = re.findall(r'(?:r|\$|£|€)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:k|000)?', text)
        numbers = [int(re.sub(r'[,\.]', '', n)) for n in numbers if n]

        # Handle "k" suffix
        if 'k' in text or '000' in text:
            numbers = [n * 1000 if n < 1000 else n for n in numbers]

        if len(numbers) >= 2:
            result["min"] = min(numbers)
            result["max"] = max(numbers)
        elif len(numbers) == 1:
            result["min"] = numbers[0]
            result["max"] = numbers[0]

        # Detect period
        if any(word in text for word in ["year", "annum", "annual", "pa"]):
            result["period"] = "annual"
            # Convert annual to monthly for consistency
            if result["min"]:
                result["min"] = result["min"] // 12
            if result["max"]:
                result["max"] = result["max"] // 12
        elif any(word in text for word in ["hour", "hr", "ph"]):
            result["period"] = "hourly"
        elif any(word in text for word in ["day", "daily", "pd"]):
            result["period"] = "daily"

        result["display"] = self._format_salary_display(result["min"], result["max"])
        return result

    def _format_salary_display(self, salary_min: Optional[int], salary_max: Optional[int]) -> str:
        """Format salary for display."""
        if not salary_min and not salary_max:
            return "Competitive — enquire"

        def fmt(n: int) -> str:
            if n >= 1000:
                return f"R{(n / 1000):.0f}k"
            return f"R{n}"

        if salary_min and salary_max and salary_max != salary_min:
            return f"{fmt(salary_min)} – {fmt(salary_max)}/month"
        elif salary_min:
            return f"{fmt(salary_min)}/month"
        elif salary_max:
            return f"{fmt(salary_max)}/month"

        return "Competitive — enquire"

    def normalize_skills(self, raw_skills: Optional[List[str]], description: Optional[str] = None) -> List[str]:
        """
        Normalize skill tags to canonical names using taxonomy.
        """
        if not raw_skills and not description:
            return []

        # Combine raw skills and skills extracted from description
        all_skills = set()

        if raw_skills:
            for skill in raw_skills:
                canonical = self._canonicalize_skill(skill)
                if canonical:
                    all_skills.add(canonical)

        if description:
            extracted = self._extract_skills_from_description(description)
            all_skills.update(extracted)

        return sorted(list(all_skills))

    def _canonicalize_skill(self, raw_skill: str) -> Optional[str]:
        """Map a raw skill string to its canonical name from taxonomy."""
        if not raw_skill:
            return None

        raw_lower = raw_skill.lower().strip()

        for category, skills in SKILL_TAXONOMY.get("categories", {}).items():
            for canonical, aliases in skills.items():
                if raw_lower == canonical.lower():
                    return canonical
                if raw_lower in [a.lower() for a in aliases]:
                    return canonical

        # No match found — return cleaned original
        return raw_lower.replace(" ", "_")

    def _extract_skills_from_description(self, description: str) -> List[str]:
        """Extract skills from job description using taxonomy matching."""
        if not description:
            return []

        desc_lower = description.lower()
        found = set()

        for category, skills in SKILL_TAXONOMY.get("categories", {}).items():
            for canonical, aliases in skills.items():
                for alias in aliases:
                    # Use word boundaries to avoid partial matches
                    pattern = rf'\b{re.escape(alias)}\b'
                    if re.search(pattern, desc_lower):
                        found.add(canonical)
                        break

        return list(found)

    def normalize_opportunity_type(self, raw_type: Optional[str]) -> Dict[str, str]:
        """
        Classify opportunity into category and type.
        Returns: {category, type}
        """
        if not raw_type:
            return {"category": "jobs", "type": "employment"}

        text = raw_type.lower().strip()

        # Training / skills programs
        training_types = {
            "internship": ["internship", "intern"],
            "learnership": ["learnership", "learnerships"],
            "apprenticeship": ["apprenticeship", "apprenticeships"],
        }

        for opp_type, aliases in training_types.items():
            if any(alias in text for alias in aliases):
                return {"category": "training_skills_programs", "type": opp_type}

        # Job types
        job_types = {
            "contract": ["contract", "contractor", "contracting"],
            "freelance": ["freelance", "freelancing", "gig"],
            "consulting": ["consulting", "consultant", "consultancy"],
            "volunteer": ["volunteer", "voluntary", "unpaid"],
            "board": ["board", "advisory board", "non-executive"],
        }

        for opp_type, aliases in job_types.items():
            if any(alias in text for alias in aliases):
                return {"category": "jobs", "type": opp_type}

        # Default
        return {"category": "jobs", "type": "employment"}

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full normalization pipeline for a raw opportunity.
        Returns a clean, standardized opportunity dict.
        """
        # Normalize title
        title = self.normalize_title(raw_data.get("title", ""))

        # Normalize company
        company = self.normalize_company(raw_data.get("company_name", ""))

        # Normalize location
        location_info = self.normalize_location(raw_data.get("location"))

        # Normalize salary
        salary_info = self.normalize_salary(
            raw_data.get("salary_text"),
            raw_data.get("salary_min"),
            raw_data.get("salary_max"),
        )

        # Normalize skills
        raw_skills = raw_data.get("skills", [])
        if isinstance(raw_skills, str):
            raw_skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
        skills = self.normalize_skills(raw_skills, raw_data.get("description"))

        # Normalize opportunity type
        type_info = self.normalize_opportunity_type(raw_data.get("opportunity_type"))

        # Parse dates
        posted_at = raw_data.get("posted_at")
        expires_at = raw_data.get("expires_at")

        # Build normalized result
        normalized = {
            "title": title,
            "company_name": company,
            "location": location_info["display"],
            "city": location_info["city"],
            "province": location_info["province"],
            "country": location_info["country"],
            "remote_type": location_info["remote_type"],
            "salary_min": salary_info["min"],
            "salary_max": salary_info["max"],
            "salary_currency": salary_info["currency"],
            "salary_period": salary_info["period"],
            "salary_visible": salary_info["visible"],
            "salary_range": salary_info["display"],
            "required_skills": skills,
            "opportunity_category": type_info["category"],
            "opportunity_type": type_info["type"],
            "description": raw_data.get("description", ""),
            "source": raw_data.get("source", "unknown"),
            "source_id": raw_data.get("source_id"),
            "source_url": raw_data.get("source_url"),
            "application_url": raw_data.get("application_url"),
            "posted_at": posted_at,
            "expires_at": expires_at,
            "experience_level": raw_data.get("experience_level"),
            "industry": raw_data.get("industry"),
        }

        return normalized
