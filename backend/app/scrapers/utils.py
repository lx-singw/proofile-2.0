"""
Job Board Scraper Utilities

Common utilities for scraping South African job boards.
"""
import re
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import asyncio

try:
    import httpx
except ImportError:
    httpx = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logger = logging.getLogger(__name__)

# User agents to rotate
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]


class ScraperConfig:
    """Configuration for job scrapers"""
    
    # Rate limiting
    REQUEST_DELAY: float = 2.0  # Seconds between requests
    MAX_RETRIES: int = 3
    TIMEOUT: float = 30.0
    
    # Pagination
    MAX_PAGES: int = 10
    JOBS_PER_PAGE: int = 20
    
    # Headers
    DEFAULT_HEADERS = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }


def get_random_user_agent() -> str:
    """Get a random user agent string"""
    import random
    return random.choice(USER_AGENTS)


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


def parse_salary(salary_text: str) -> Dict[str, Any]:
    """
    Parse salary text into structured format.
    
    Examples:
        "R50,000 - R80,000 per month" -> {min: 50000, max: 80000, currency: "ZAR", period: "monthly"}
        "R600k - R800k p.a." -> {min: 600000, max: 800000, currency: "ZAR", period: "yearly"}
    """
    result = {
        "min": None,
        "max": None,
        "currency": "ZAR",
        "period": "monthly"
    }
    
    if not salary_text:
        return result
    
    salary_text = salary_text.upper()
    
    # Determine period
    if any(x in salary_text for x in ["P.A.", "PER ANNUM", "ANNUAL", "YEAR"]):
        result["period"] = "yearly"
    elif any(x in salary_text for x in ["P.M.", "MONTH", "MONTHLY"]):
        result["period"] = "monthly"
    elif any(x in salary_text for x in ["HOUR", "HOURLY"]):
        result["period"] = "hourly"
    
    # Extract numbers
    numbers = re.findall(r'[\d,]+(?:\.\d+)?[KM]?', salary_text)
    parsed_numbers = []
    
    for num in numbers:
        # Handle K/M suffixes
        multiplier = 1
        if num.endswith('K'):
            multiplier = 1000
            num = num[:-1]
        elif num.endswith('M'):
            multiplier = 1000000
            num = num[:-1]
        
        try:
            value = float(num.replace(',', '')) * multiplier
            parsed_numbers.append(int(value))
        except ValueError:
            continue
    
    if len(parsed_numbers) >= 2:
        result["min"] = min(parsed_numbers[:2])
        result["max"] = max(parsed_numbers[:2])
    elif len(parsed_numbers) == 1:
        result["min"] = parsed_numbers[0]
        result["max"] = parsed_numbers[0]
    
    return result


def parse_relative_date(date_text: str) -> datetime:
    """
    Parse relative date text into datetime.
    
    Examples:
        "Posted 2 days ago" -> datetime
        "1 hour ago" -> datetime
        "Just now" -> datetime
    """
    now = datetime.utcnow()
    date_text = date_text.lower().strip()
    
    if "just now" in date_text or "now" in date_text:
        return now
    
    # Extract number
    match = re.search(r'(\d+)', date_text)
    if not match:
        return now
    
    amount = int(match.group(1))
    
    if "minute" in date_text:
        return now - timedelta(minutes=amount)
    elif "hour" in date_text:
        return now - timedelta(hours=amount)
    elif "day" in date_text:
        return now - timedelta(days=amount)
    elif "week" in date_text:
        return now - timedelta(weeks=amount)
    elif "month" in date_text:
        return now - timedelta(days=amount * 30)
    
    return now


def clean_text(text: Optional[str]) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract skills from job description using keyword matching.
    """
    # Common tech skills
    SKILL_KEYWORDS = [
        # Programming Languages
        "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust", 
        "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",
        # Frontend
        "React", "Angular", "Vue", "Next.js", "HTML", "CSS", "SASS", "Tailwind",
        # Backend
        "Node.js", "Django", "Flask", "FastAPI", "Spring", "Express", ".NET",
        # Databases
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
        # Cloud
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
        # Data
        "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas",
        "Power BI", "Tableau", "Excel",
        # Tools
        "Git", "JIRA", "Agile", "Scrum", "CI/CD", "Jenkins",
        # Finance specific
        "Financial Modeling", "Risk Management", "Bloomberg", "CFA", "FAIS",
    ]
    
    found = []
    text_lower = text.lower()
    
    for skill in SKILL_KEYWORDS:
        if skill.lower() in text_lower:
            found.append(skill)
    
    return found[:10]  # Limit to 10 skills


def extract_experience_level(text: str) -> str:
    """Determine experience level from text"""
    text_lower = text.lower()
    
    if any(x in text_lower for x in ["senior", "lead", "principal", "head of", "director"]):
        return "senior"
    elif any(x in text_lower for x in ["junior", "entry", "graduate", "intern", "trainee"]):
        return "entry"
    elif any(x in text_lower for x in ["mid", "intermediate", "2-5 years", "3-5 years"]):
        return "mid"
    
    # Check for year requirements
    years_match = re.search(r'(\d+)\+?\s*years?', text_lower)
    if years_match:
        years = int(years_match.group(1))
        if years <= 2:
            return "entry"
        elif years <= 5:
            return "mid"
        else:
            return "senior"
    
    return "mid"  # Default


def extract_location_type(title: str, description: str) -> str:
    """Determine if job is remote, hybrid, or onsite"""
    text = f"{title} {description}".lower()
    
    if any(x in text for x in ["fully remote", "100% remote", "work from home", "remote only"]):
        return "remote"
    elif any(x in text for x in ["hybrid", "flexible", "partial remote"]):
        return "hybrid"
    elif any(x in text for x in ["on-site", "onsite", "in-office", "office based"]):
        return "onsite"
    elif "remote" in text:
        return "remote"
    
    return "onsite"  # Default


async def fetch_page(url: str, headers: Optional[Dict] = None) -> Optional[str]:
    """
    Fetch a page with proper headers and error handling.
    Returns HTML content or None on failure.
    """
    if httpx is None:
        logger.error("httpx is not installed")
        return None
    
    default_headers = ScraperConfig.DEFAULT_HEADERS.copy()
    default_headers["User-Agent"] = get_random_user_agent()
    
    if headers:
        default_headers.update(headers)
    
    for attempt in range(ScraperConfig.MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=ScraperConfig.TIMEOUT, follow_redirects=True) as client:
                response = await client.get(url, headers=default_headers)
                response.raise_for_status()
                return response.text
                
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP error {e.response.status_code} for {url}")
            if e.response.status_code == 429:  # Rate limited
                await asyncio.sleep(ScraperConfig.REQUEST_DELAY * (attempt + 2))
            elif e.response.status_code in [403, 503]:  # Blocked
                await asyncio.sleep(ScraperConfig.REQUEST_DELAY * 5)
                
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
        
        if attempt < ScraperConfig.MAX_RETRIES - 1:
            await asyncio.sleep(ScraperConfig.REQUEST_DELAY)
    
    return None


def parse_html(html: str) -> Optional["BeautifulSoup"]:
    """Parse HTML content with BeautifulSoup"""
    if BeautifulSoup is None:
        logger.error("BeautifulSoup is not installed")
        return None
    
    return BeautifulSoup(html, 'html.parser')
