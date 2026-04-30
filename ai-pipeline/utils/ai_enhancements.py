"""
AI Pipeline Enhancement Utilities
Contains all 10 advanced enhancements for comprehensive opportunity processing.
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
import calendar


# ============================================================================
# ENHANCEMENT 1: INTELLIGENT SALARY PARSING
# ============================================================================

@dataclass
class SalaryResult:
    """Structured salary extraction result."""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_type: str = "unknown"  # monthly, annual, hourly, daily, stipend
    confidence: float = 0.0
    is_stipend: bool = False
    original_text: str = ""
    warnings: List[str] = field(default_factory=list)


class SalaryParser:
    """Intelligent South African salary extraction and normalization."""
    
    # SA salary patterns
    SAT_PATTERNS = [
        # Range with space/comma thousands: R15 000 - R20 000
        (r'R\s*(\d{1,3}(?:[ ,\.]\d{3})*(?:\.\d{2})?)\s*[k]?\s*[-–to]+\s*R?\s*(\d{1,3}(?:[ ,\.]\d{3})*(?:\.\d{2})?)\s*[k]?', 'range'),
        # Single with k: R15k
        (r'R\s*([\d]+(?:\.\d{1,2})?)\s*[kK]', 'single_k'),
        # Single with space/comma thousands: R15 000, R4 900
        (r'R\s*(\d{1,3}(?:[ ,\.]\d{3})*(?:\.\d{2})?)', 'single'),
        # Plain number with context
        (r'(\d{1,3}(?:[ ,\.]\d{3})*)\s*(?:per\s*month|pm|p\.m\.|p/m)', 'plain_monthly'),
    ]
    
    PERIOD_MULTIPLIERS = {
        'hour': 40 * 4.33,  # 40hrs/week * 4.33 weeks/month
        'hourly': 40 * 4.33,
        'day': 22,  # 22 working days per month
        'daily': 22,
        'week': 4.33,
        'weekly': 4.33,
        'month': 1,
        'monthly': 1,
        'pm': 1,
        'p.m.': 1,
        'p/m': 1,
        'annum': 1/12,
        'annual': 1/12,
        'year': 1/12,
        'yearly': 1/12,
        'pa': 1/12,
        'p.a.': 1/12,
    }
    
    # Patterns that indicate NOT a real salary
    EXCLUDE_PATTERNS = [
        r'competitive',
        r'market.?related',
        r'negotiable',
        r'to.?be.?discussed',
        r'tbd',
        r'tbc',
        r'attractive',
        r'excellent',
    ]
    
    STIPEND_KEYWORDS = ['stipend', 'allowance', 'bursary', 'learnership']
    
    # Market validation thresholds (ZAR monthly)
    MARKET_THRESHOLDS = {
        'intern': (2000, 15000),
        'junior': (8000, 35000),
        'mid': (20000, 60000),
        'senior': (40000, 120000),
        'lead': (60000, 150000),
        'executive': (80000, 500000),
    }
    
    @classmethod
    def parse(cls, text: str, experience_level: str = None) -> SalaryResult:
        """Extract and normalize salary from text."""
        if not text:
            return SalaryResult()
        
        text_lower = text.lower()
        result = SalaryResult(original_text=text)
        
        # Check for exclusion patterns
        for pattern in cls.EXCLUDE_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                result.salary_type = "unspecified"
                result.confidence = 0.0
                return result
        
        # Check for stipend
        result.is_stipend = any(kw in text_lower for kw in cls.STIPEND_KEYWORDS)
        
        # Detect period
        period_multiplier = 1  # Default monthly
        for period, multiplier in cls.PERIOD_MULTIPLIERS.items():
            if period in text_lower:
                period_multiplier = multiplier
                if multiplier == 1:
                    result.salary_type = "monthly"
                elif multiplier < 1:
                    result.salary_type = "annual"
                else:
                    result.salary_type = "hourly" if 'hour' in period else "daily"
                break
        
        # Try each pattern
        for pattern, pattern_type in cls.SAT_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if pattern_type == 'range':
                        min_val = cls._parse_number(match.group(1))
                        max_val = cls._parse_number(match.group(2))
                        # Handle k suffix
                        if 'k' in text_lower[match.start():match.end()].lower():
                            min_val *= 1000
                            max_val *= 1000
                    elif pattern_type == 'single_k':
                        val = cls._parse_number(match.group(1)) * 1000
                        min_val = max_val = val
                    else:
                        val = cls._parse_number(match.group(1))
                        min_val = max_val = val
                    
                    # Apply period multiplier
                    result.salary_min = int(min_val * period_multiplier)
                    result.salary_max = int(max_val * period_multiplier)
                    result.confidence = 0.9 if pattern_type == 'range' else 0.8
                    
                    break
                except (ValueError, IndexError):
                    continue
        
        # Market validation
        if result.salary_min and experience_level:
            level = experience_level.lower()
            if level in cls.MARKET_THRESHOLDS:
                min_thresh, max_thresh = cls.MARKET_THRESHOLDS[level]
                if result.salary_min < min_thresh:
                    result.warnings.append(f"Salary below market rate for {level} level")
                if result.salary_max and result.salary_max > max_thresh * 1.5:
                    result.warnings.append(f"Salary unusually high for {level} level")
        
        # Stipend validation
        if result.is_stipend and result.salary_min and result.salary_min < 2000:
            result.warnings.append("Stipend unusually low (below R2000/month)")
        
        return result
    
    @staticmethod
    def _parse_number(s: str) -> float:
        """Parse number string, handling commas and decimals."""
        return float(s.replace(',', '').replace(' ', ''))


# ============================================================================
# ENHANCEMENT 2: EXPERIENCE LEVEL AUTO-CLASSIFICATION
# ============================================================================

class ExperienceClassifier:
    """Classify experience level from job description and title."""
    
    YEAR_PATTERNS = [
        (r'(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)', 'range'),
        (r'(\d+)\s*\+?\s*(?:years?|yrs?)', 'min'),
        (r'min(?:imum)?\s*(?:of\s*)?(\d+)\s*(?:years?|yrs?)', 'min'),
        (r'at\s*least\s*(\d+)\s*(?:years?|yrs?)', 'min'),
    ]
    
    TITLE_KEYWORDS = {
        'intern': ['intern', 'internship', 'learner', 'trainee', 'graduate', 'entry level', 'entry-level'],
        'junior': ['junior', 'jr', 'associate', 'assistant'],
        'mid': ['mid', 'intermediate', 'experienced'],
        'senior': ['senior', 'sr', 'snr', 'specialist', 'expert'],
        'lead': ['lead', 'principal', 'staff', 'architect', 'team lead'],
        'executive': ['director', 'vp', 'vice president', 'ceo', 'cto', 'cfo', 'coo', 'executive', 'head of', 'chief'],
    }
    
    YEAR_TO_LEVEL = {
        (0, 0): 'intern',
        (0, 2): 'junior',
        (2, 5): 'mid',
        (5, 8): 'senior',
        (8, 12): 'lead',
        (12, 100): 'executive',
    }
    
    @classmethod
    def classify(cls, text: str, title: str = "") -> Dict[str, Any]:
        """Classify experience level from text and title."""
        result = {
            'level': None,
            'years_min': None,
            'years_max': None,
            'confidence': 0.0,
            'source': None,
        }
        
        combined = f"{title} {text}".lower()
        
        # First try title keywords (highest confidence)
        for level, keywords in cls.TITLE_KEYWORDS.items():
            for kw in keywords:
                if kw in combined:
                    result['level'] = level.capitalize()
                    result['confidence'] = 0.85
                    result['source'] = 'title'
                    break
            if result['level']:
                break
        
        # Then try year patterns
        for pattern, ptype in cls.YEAR_PATTERNS:
            match = re.search(pattern, combined, re.IGNORECASE)
            if match:
                try:
                    if ptype == 'range':
                        years_min = int(match.group(1))
                        years_max = int(match.group(2))
                    else:
                        years_min = int(match.group(1))
                        years_max = years_min + 3  # Assume range
                    
                    # Exclude age patterns like "18-35 years"
                    if years_min >= 16 and years_max <= 65:
                        continue  # This is likely age, not experience
                    
                    result['years_min'] = years_min
                    result['years_max'] = years_max
                    
                    # Map years to level
                    for (ymin, ymax), level in cls.YEAR_TO_LEVEL.items():
                        if ymin <= years_min <= ymax:
                            if not result['level']:  # Don't override title match
                                result['level'] = level.capitalize()
                                result['confidence'] = 0.75
                                result['source'] = 'years'
                            break
                    break
                except (ValueError, IndexError):
                    continue
        
        # Default to Mid if no clear indicators
        if not result['level']:
            result['level'] = 'Mid'
            result['confidence'] = 0.3
            result['source'] = 'default'
        
        return result


# ============================================================================
# ENHANCEMENT 3: MULTI-LAYER SCAM DETECTION
# ============================================================================

@dataclass
class ScamAnalysis:
    """Comprehensive scam analysis result."""
    scam_score: float = 0.0
    risk_level: str = "low"  # low, medium, high, critical
    red_flags: List[str] = field(default_factory=list)
    email_score: float = 0.0
    payment_score: float = 0.0
    promise_score: float = 0.0
    company_score: float = 0.0
    pattern_score: float = 0.0
    recommendation: str = "show"  # show, warn, quarantine


class ScamDetector:
    """Multi-layer scam detection system."""
    
    # Suspicious email domains
    SUSPICIOUS_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'ymail.com']
    TRUSTED_DOMAINS = ['.gov.za', '.ac.za', '.co.za', '.org.za']
    
    # Payment-related red flags
    PAYMENT_KEYWORDS = [
        'pay for training', 'training fee', 'registration fee', 'admin fee',
        'buy uniform', 'purchase equipment', 'deposit required', 'upfront payment',
        'send money', 'money transfer', 'western union', 'bitcoin', 'crypto',
    ]
    
    # Unrealistic promise patterns
    PROMISE_PATTERNS = [
        (r'earn\s*R?\s*\d{4,}.*(?:week|day)', 0.7),  # High daily/weekly earnings
        (r'work\s*from\s*home.*R\s*\d{5,}', 0.5),  # High WFH salary
        (r'no\s*experience\s*(?:needed|required).*R\s*\d{4,}', 0.4),  # No exp + high pay
        (r'guaranteed\s*(?:income|job|placement)', 0.4),
        (r'100%\s*(?:success|guaranteed|placement)', 0.5),
        (r'limited\s*(?:spots|positions|time)', 0.3),
        (r'act\s*now|urgent|immediately', 0.2),
    ]
    
    # Known scam template patterns
    SCAM_TEMPLATES = [
        r'congratulations.*selected',
        r'you\s*have\s*been\s*chosen',
        r'winner.*lottery',
        r'inheritance.*funds',
    ]
    
    # WhatsApp-only contact (suspicious)
    WHATSAPP_PATTERNS = [
        r'whatsapp\s*only',
        r'contact.*(?:via|on)\s*whatsapp',
        r'apply\s*(?:via|on)\s*whatsapp',
    ]
    
    @classmethod
    def analyze(cls, text: str, email: str = None, company: str = None) -> ScamAnalysis:
        """Perform comprehensive scam analysis."""
        analysis = ScamAnalysis()
        text_lower = text.lower() if text else ""
        
        # Layer 1: Email domain check
        if email:
            domain = email.split('@')[-1].lower() if '@' in email else ""
            if domain in cls.SUSPICIOUS_DOMAINS:
                analysis.email_score = 0.4
                analysis.red_flags.append(f"Personal email domain: {domain}")
            elif any(d in domain for d in cls.TRUSTED_DOMAINS):
                analysis.email_score = 0.0
            else:
                analysis.email_score = 0.1  # Unknown corporate domain
        
        # Layer 2: Payment keywords
        for keyword in cls.PAYMENT_KEYWORDS:
            if keyword in text_lower:
                analysis.payment_score = max(analysis.payment_score, 0.6)
                analysis.red_flags.append(f"Payment mentioned: '{keyword}'")
        
        # Layer 3: Unrealistic promises
        for pattern, score in cls.PROMISE_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                analysis.promise_score = max(analysis.promise_score, score)
                analysis.red_flags.append(f"Suspicious promise pattern detected")
        
        # Layer 4: Company verification placeholder
        if not company or company.lower() in ['confidential', 'private', 'anonymous', 'n/a']:
            analysis.company_score = 0.3
            analysis.red_flags.append("Company name not disclosed")
        
        # Layer 5: Known scam patterns
        for pattern in cls.SCAM_TEMPLATES:
            if re.search(pattern, text_lower, re.IGNORECASE):
                analysis.pattern_score = 0.8
                analysis.red_flags.append("Known scam template detected")
                break
        
        # WhatsApp-only check
        for pattern in cls.WHATSAPP_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                analysis.red_flags.append("WhatsApp-only contact")
                analysis.company_score = max(analysis.company_score, 0.3)
        
        # Calculate composite score with weights
        analysis.scam_score = (
            analysis.email_score * 0.20 +
            analysis.payment_score * 0.35 +
            analysis.promise_score * 0.20 +
            analysis.company_score * 0.15 +
            analysis.pattern_score * 0.10
        )
        
        # Determine risk level and recommendation
        if analysis.scam_score >= 0.7:
            analysis.risk_level = "critical"
            analysis.recommendation = "quarantine"
        elif analysis.scam_score >= 0.5:
            analysis.risk_level = "high"
            analysis.recommendation = "quarantine"
        elif analysis.scam_score >= 0.3:
            analysis.risk_level = "medium"
            analysis.recommendation = "warn"
        else:
            analysis.risk_level = "low"
            analysis.recommendation = "show"
        
        return analysis


# ============================================================================
# ENHANCEMENT 4: FUZZY DATE PARSING
# ============================================================================

@dataclass
class DeadlineResult:
    """Structured deadline parsing result."""
    deadline_date: Optional[str] = None  # ISO format YYYY-MM-DD
    deadline_type: str = "unknown"  # fixed, urgent, rolling, ongoing
    estimated_date: Optional[str] = None  # Best guess when date unclear
    confidence: float = 0.0
    original_text: str = ""
    is_expired: bool = False
    grace_period_active: bool = False


class DeadlineParser:
    """Intelligent deadline parsing with fuzzy date handling."""
    
    URGENT_KEYWORDS = ['asap', 'immediately', 'urgent', 'urgently']
    ROLLING_KEYWORDS = ['until filled', 'until position is filled', 'ongoing recruitment']
    ONGOING_KEYWORDS = ['ongoing', 'open', 'continuous', 'rolling']
    
    RELATIVE_PATTERNS = [
        (r'end\s*of\s*(?:this\s*)?month', 'end_of_month'),
        (r'end\s*of\s*(?:this\s*)?week', 'end_of_week'),
        (r'next\s*(?:monday|tuesday|wednesday|thursday|friday)', 'next_weekday'),
        (r'(?:this|next)\s+friday', 'this_friday'),
        (r'(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:of\s*)?(january|february|march|april|may|june|july|august|september|october|november|december)', 'date_month'),
    ]
    
    MONTH_MAP = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }
    
    GRACE_PERIOD_DAYS = 7
    
    @classmethod
    def parse(cls, text: str, reference_date: datetime = None) -> DeadlineResult:
        """Parse deadline from text with fuzzy matching."""
        if not text:
            return DeadlineResult()
        
        ref = reference_date or datetime.now()
        result = DeadlineResult(original_text=text)
        text_lower = text.lower().strip()
        
        # Check for urgent keywords
        if any(kw in text_lower for kw in cls.URGENT_KEYWORDS):
            result.deadline_type = "urgent"
            result.estimated_date = (ref + timedelta(days=7)).strftime('%Y-%m-%d')
            result.confidence = 0.5
            return result
        
        # Check for rolling/ongoing
        if any(kw in text_lower for kw in cls.ROLLING_KEYWORDS):
            result.deadline_type = "rolling"
            result.estimated_date = (ref + timedelta(days=60)).strftime('%Y-%m-%d')
            result.confidence = 0.4
            return result
        
        if any(kw in text_lower for kw in cls.ONGOING_KEYWORDS):
            result.deadline_type = "ongoing"
            result.estimated_date = (ref + timedelta(days=90)).strftime('%Y-%m-%d')
            result.confidence = 0.3
            return result
        
        # Try relative patterns
        for pattern, ptype in cls.RELATIVE_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    if ptype == 'end_of_month':
                        last_day = calendar.monthrange(ref.year, ref.month)[1]
                        deadline = ref.replace(day=last_day)
                    elif ptype == 'end_of_week':
                        days_until_friday = (4 - ref.weekday()) % 7
                        deadline = ref + timedelta(days=days_until_friday)
                    elif ptype == 'date_month':
                        day = int(match.group(1))
                        month = cls.MONTH_MAP.get(match.group(2).lower(), ref.month)
                        year = ref.year if month >= ref.month else ref.year + 1
                        deadline = datetime(year, month, min(day, 28))
                    else:
                        continue
                    
                    result.deadline_date = deadline.strftime('%Y-%m-%d')
                    result.deadline_type = "fixed"
                    result.confidence = 0.7
                    
                    # Check if expired
                    if deadline < ref:
                        result.is_expired = True
                        if (ref - deadline).days <= cls.GRACE_PERIOD_DAYS:
                            result.grace_period_active = True
                    
                    return result
                except (ValueError, AttributeError):
                    continue
        
        # Try standard date formats
        date_patterns = [
            r'(\d{4})-(\d{2})-(\d{2})',  # ISO
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # DD/MM/YYYY
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # DD-MM-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    groups = match.groups()
                    if len(groups[0]) == 4:  # ISO format
                        deadline = datetime(int(groups[0]), int(groups[1]), int(groups[2]))
                    else:  # DD/MM/YYYY
                        deadline = datetime(int(groups[2]), int(groups[1]), int(groups[0]))
                    
                    result.deadline_date = deadline.strftime('%Y-%m-%d')
                    result.deadline_type = "fixed"
                    result.confidence = 0.9
                    
                    if deadline < ref:
                        result.is_expired = True
                        if (ref - deadline).days <= cls.GRACE_PERIOD_DAYS:
                            result.grace_period_active = True
                    
                    return result
                except ValueError:
                    continue
        
        return result


# ============================================================================
# ENHANCEMENT 5: LOCATION INTELLIGENCE
# ============================================================================

@dataclass
class LocationResult:
    """Structured location extraction result."""
    city: Optional[str] = None
    province: Optional[str] = None
    country: str = "South Africa"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    work_arrangement: Optional[str] = None  # remote, hybrid, onsite
    confidence: float = 0.0
    raw_text: str = ""


class LocationParser:
    """South African location parsing and normalization."""
    
    # Province normalization
    PROVINCE_MAP = {
        'gp': 'Gauteng', 'gauteng': 'Gauteng', 'gt': 'Gauteng',
        'wc': 'Western Cape', 'western cape': 'Western Cape',
        'kzn': 'KwaZulu-Natal', 'kwazulu-natal': 'KwaZulu-Natal', 'kwazulu natal': 'KwaZulu-Natal',
        'ec': 'Eastern Cape', 'eastern cape': 'Eastern Cape',
        'nc': 'Northern Cape', 'northern cape': 'Northern Cape',
        'fs': 'Free State', 'free state': 'Free State',
        'lp': 'Limpopo', 'limpopo': 'Limpopo',
        'mp': 'Mpumalanga', 'mpumalanga': 'Mpumalanga',
        'nw': 'North West', 'north west': 'North West',
    }
    
    # City aliases and coordinates
    CITY_DATA = {
        'jhb': ('Johannesburg', 'Gauteng', -26.2041, 28.0473),
        'johannesburg': ('Johannesburg', 'Gauteng', -26.2041, 28.0473),
        'joburg': ('Johannesburg', 'Gauteng', -26.2041, 28.0473),
        'sandton': ('Sandton', 'Gauteng', -26.1076, 28.0567),
        'pretoria': ('Pretoria', 'Gauteng', -25.7479, 28.2293),
        'pta': ('Pretoria', 'Gauteng', -25.7479, 28.2293),
        'tshwane': ('Pretoria', 'Gauteng', -25.7479, 28.2293),
        'cape town': ('Cape Town', 'Western Cape', -33.9249, 18.4241),
        'cpt': ('Cape Town', 'Western Cape', -33.9249, 18.4241),
        'durban': ('Durban', 'KwaZulu-Natal', -29.8587, 31.0218),
        'dbn': ('Durban', 'KwaZulu-Natal', -29.8587, 31.0218),
        'port elizabeth': ('Port Elizabeth', 'Eastern Cape', -33.9608, 25.6022),
        'pe': ('Port Elizabeth', 'Eastern Cape', -33.9608, 25.6022),
        'gqeberha': ('Port Elizabeth', 'Eastern Cape', -33.9608, 25.6022),
        'bloemfontein': ('Bloemfontein', 'Free State', -29.0852, 26.1596),
        'bloem': ('Bloemfontein', 'Free State', -29.0852, 26.1596),
        'east london': ('East London', 'Eastern Cape', -32.9830, 27.8684),
        'polokwane': ('Polokwane', 'Limpopo', -23.8962, 29.4486),
        'nelspruit': ('Nelspruit', 'Mpumalanga', -25.4753, 30.9694),
        'mbombela': ('Nelspruit', 'Mpumalanga', -25.4753, 30.9694),
        'kimberley': ('Kimberley', 'Northern Cape', -28.7282, 24.7499),
        'rustenburg': ('Rustenburg', 'North West', -25.6676, 27.2420),
        'midrand': ('Midrand', 'Gauteng', -25.9891, 28.1284),
        'centurion': ('Centurion', 'Gauteng', -25.8603, 28.1894),
        'roodepoort': ('Roodepoort', 'Gauteng', -26.1625, 27.8625),
        'soweto': ('Soweto', 'Gauteng', -26.2227, 27.8896),
        'stellenbosch': ('Stellenbosch', 'Western Cape', -33.9321, 18.8602),
        'pietermaritzburg': ('Pietermaritzburg', 'KwaZulu-Natal', -29.6006, 30.3794),
    }
    
    REMOTE_KEYWORDS = ['remote', 'work from home', 'wfh', 'virtual', 'online']
    HYBRID_KEYWORDS = ['hybrid', 'flexible', 'partly remote', 'partial remote']
    ONSITE_KEYWORDS = ['on-site', 'onsite', 'office-based', 'in-office', 'in-person']
    
    @classmethod
    def parse(cls, text: str) -> LocationResult:
        """Parse and normalize location from text."""
        if not text:
            return LocationResult()
        
        result = LocationResult(raw_text=text)
        text_lower = text.lower().strip()
        
        # Detect work arrangement
        if any(kw in text_lower for kw in cls.REMOTE_KEYWORDS):
            result.work_arrangement = "remote"
        elif any(kw in text_lower for kw in cls.HYBRID_KEYWORDS):
            result.work_arrangement = "hybrid"
        elif any(kw in text_lower for kw in cls.ONSITE_KEYWORDS):
            result.work_arrangement = "onsite"
        
        # Try to match city
        for alias, (city, province, lat, lng) in cls.CITY_DATA.items():
            if alias in text_lower:
                result.city = city
                result.province = province
                result.latitude = lat
                result.longitude = lng
                result.confidence = 0.9
                break
        
        # Try to match province if no city found
        if not result.city:
            for alias, province in cls.PROVINCE_MAP.items():
                if alias in text_lower:
                    result.province = province
                    result.confidence = 0.6
                    break
        
        # Handle nationwide/remote
        if 'nationwide' in text_lower or 'south africa' in text_lower:
            result.country = "South Africa"
            if not result.city and not result.province:
                result.confidence = 0.5
        
        return result


# ============================================================================
# ENHANCEMENT 6: SKILLS EXTRACTION
# ============================================================================

class SkillsExtractor:
    """Extract and standardize skills from job descriptions."""
    
    # Technical skills normalization
    SKILL_ALIASES = {
        'react': ['react', 'react.js', 'reactjs', 'react js'],
        'node.js': ['node', 'node.js', 'nodejs', 'node js'],
        'python': ['python', 'python3', 'py'],
        'javascript': ['javascript', 'js', 'ecmascript'],
        'typescript': ['typescript', 'ts'],
        'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'mssql', 'sql server'],
        'excel': ['excel', 'microsoft excel', 'ms excel', 'advanced excel'],
        'powerpoint': ['powerpoint', 'microsoft powerpoint', 'ms powerpoint'],
        'word': ['word', 'microsoft word', 'ms word'],
    }
    
    # Skill categories
    SKILL_CATEGORIES = {
        'programming': ['python', 'java', 'javascript', 'typescript', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'],
        'frontend': ['react', 'angular', 'vue', 'html', 'css', 'sass', 'tailwind'],
        'backend': ['node.js', 'django', 'flask', 'spring', 'express', '.net', 'fastapi'],
        'database': ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'],
        'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
        'office': ['excel', 'word', 'powerpoint', 'outlook', 'ms office'],
        'soft_skills': ['communication', 'teamwork', 'leadership', 'problem solving', 'time management'],
    }
    
    # Proficiency patterns
    PROFICIENCY_PATTERNS = [
        (r'expert\s+(?:in\s+)?(\w+)', 'expert'),
        (r'advanced\s+(\w+)', 'advanced'),
        (r'proficient\s+(?:in\s+)?(\w+)', 'proficient'),
        (r'familiar\s+with\s+(\w+)', 'basic'),
        (r'knowledge\s+of\s+(\w+)', 'basic'),
    ]
    
    @classmethod
    def extract(cls, text: str) -> Dict[str, Any]:
        """Extract and categorize skills from text."""
        if not text:
            return {'skills': [], 'categories': {}, 'soft_skills': []}
        
        text_lower = text.lower()
        found_skills = {}
        soft_skills = []
        
        # Find skills by alias matching
        for canonical, aliases in cls.SKILL_ALIASES.items():
            for alias in aliases:
                if re.search(r'\b' + re.escape(alias) + r'\b', text_lower):
                    found_skills[canonical] = {
                        'name': canonical,
                        'proficiency': 'required',
                        'category': cls._get_category(canonical)
                    }
                    break
        
        # Check proficiency levels
        for pattern, level in cls.PROFICIENCY_PATTERNS:
            matches = re.findall(pattern, text_lower)
            for skill in matches:
                if skill in found_skills:
                    found_skills[skill]['proficiency'] = level
        
        # Extract soft skills
        for skill in cls.SKILL_CATEGORIES.get('soft_skills', []):
            if skill in text_lower:
                soft_skills.append(skill.title())
        
        # Categorize skills
        categories = {}
        for skill_name, skill_data in found_skills.items():
            cat = skill_data['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(skill_name)
        
        return {
            'skills': list(found_skills.values()),
            'categories': categories,
            'soft_skills': soft_skills
        }
    
    @classmethod
    def _get_category(cls, skill: str) -> str:
        """Get category for a skill."""
        for category, skills in cls.SKILL_CATEGORIES.items():
            if skill.lower() in [s.lower() for s in skills]:
                return category
        return 'other'


# ============================================================================
# ENHANCEMENT 7: ENHANCED DEDUPLICATION
# ============================================================================

class FuzzyDeduplicator:
    """Fuzzy matching for opportunity deduplication."""
    
    # Company name normalization patterns
    COMPANY_SUFFIXES = [
        r'\s*\(pty\)\s*ltd\.?',
        r'\s*pty\s*ltd\.?',
        r'\s*\(pty\)\.?',
        r'\s*limited\.?',
        r'\s*ltd\.?',
        r'\s*inc\.?',
        r'\s*cc\.?',
        r'\s*\(sa\)',
    ]
    
    @classmethod
    def normalize_company(cls, name: str) -> str:
        """Normalize company name for comparison."""
        if not name:
            return ""
        
        normalized = name.lower().strip()
        
        # Remove common suffixes
        for suffix in cls.COMPANY_SUFFIXES:
            normalized = re.sub(suffix, '', normalized, flags=re.IGNORECASE)
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    @classmethod
    def title_similarity(cls, title1: str, title2: str) -> float:
        """Calculate similarity between two titles (0-1)."""
        if not title1 or not title2:
            return 0.0
        
        t1 = title1.lower().strip()
        t2 = title2.lower().strip()
        
        if t1 == t2:
            return 1.0
        
        # Simple word overlap similarity
        words1 = set(t1.split())
        words2 = set(t2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union)
    
    @classmethod
    def is_duplicate(cls, opp1: Dict, opp2: Dict, threshold: float = 0.85) -> bool:
        """Check if two opportunities are duplicates."""
        # Exact URL match
        if opp1.get('source_url') and opp1.get('source_url') == opp2.get('source_url'):
            return True
        
        # Title + Company similarity
        title_sim = cls.title_similarity(opp1.get('title', ''), opp2.get('title', ''))
        
        company1 = cls.normalize_company(opp1.get('company', ''))
        company2 = cls.normalize_company(opp2.get('company', ''))
        company_match = company1 == company2 and company1 != ""
        
        # Location match
        loc1 = (opp1.get('location', {}).get('city', '') or '').lower()
        loc2 = (opp2.get('location', {}).get('city', '') or '').lower()
        location_match = loc1 == loc2 and loc1 != ""
        
        # Combined score
        if company_match and title_sim > threshold:
            return True
        
        if company_match and location_match and title_sim > 0.7:
            return True
        
        return False


# ============================================================================
# ENHANCEMENT 8: CONTENT QUALITY SCORING
# ============================================================================

@dataclass
class QualityScore:
    """Content quality assessment result."""
    overall_score: float = 0.0  # 0-100
    completeness: float = 0.0
    readability: float = 0.0
    professionalism: float = 0.0
    badge: str = "standard"  # excellent, good, standard, limited
    missing_fields: List[str] = field(default_factory=list)
    issues: List[str] = field(default_factory=list)


class QualityScorer:
    """Assess content quality of opportunities."""
    
    # Important fields and their weights
    FIELD_WEIGHTS = {
        'title': 10,
        'company': 10,
        'location': 8,
        'description': 15,
        'salary_min': 10,
        'deadline': 8,
        'contact_email': 7,
        'requirements': 7,
        'required_documents': 5,
    }
    
    # Professionalism red flags
    UNPROFESSIONAL_PATTERNS = [
        (r'[A-Z]{5,}', "Excessive caps"),
        (r'!{2,}', "Multiple exclamation marks"),
        (r'\$+', "Dollar signs (should use R)"),
        (r'click here', "Generic CTA"),
        (r'dear applicant', "Generic salutation"),
    ]
    
    @classmethod
    def score(cls, opportunity: Dict) -> QualityScore:
        """Calculate quality score for an opportunity."""
        result = QualityScore()
        
        # Completeness scoring
        completeness_total = sum(cls.FIELD_WEIGHTS.values())
        completeness_achieved = 0
        
        for field, weight in cls.FIELD_WEIGHTS.items():
            value = opportunity.get(field)
            if value and str(value).strip() not in ['', 'null', 'None']:
                completeness_achieved += weight
            else:
                result.missing_fields.append(field)
        
        result.completeness = (completeness_achieved / completeness_total) * 100
        
        # Readability scoring (based on description)
        description = opportunity.get('description', '') or ''
        if description:
            word_count = len(description.split())
            has_structure = bool(re.search(r'\n\n|\n-|\n\d\.', description))
            
            if word_count >= 100 and has_structure:
                result.readability = 100
            elif word_count >= 50:
                result.readability = 70
            elif word_count >= 20:
                result.readability = 40
            else:
                result.readability = 20
        
        # Professionalism scoring
        full_text = f"{opportunity.get('title', '')} {description}"
        professionalism_issues = 0
        
        for pattern, issue in cls.UNPROFESSIONAL_PATTERNS:
            if re.search(pattern, full_text, re.IGNORECASE):
                result.issues.append(issue)
                professionalism_issues += 1
        
        result.professionalism = max(0, 100 - (professionalism_issues * 20))
        
        # Overall score
        result.overall_score = (
            result.completeness * 0.5 +
            result.readability * 0.25 +
            result.professionalism * 0.25
        )
        
        # Assign badge
        if result.overall_score >= 80:
            result.badge = "excellent"
        elif result.overall_score >= 60:
            result.badge = "good"
        elif result.overall_score >= 40:
            result.badge = "standard"
        else:
            result.badge = "limited"
        
        return result


# ============================================================================
# ENHANCEMENT 9: COMPANY VERIFICATION
# ============================================================================

@dataclass
class CompanyInfo:
    """Company verification and enrichment data."""
    name: str = ""
    normalized_name: str = ""
    is_verified: bool = False
    verification_source: Optional[str] = None  # cipc, manual, user_report
    registration_number: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[str] = None
    website: Optional[str] = None
    trust_score: float = 0.5
    warnings: List[str] = field(default_factory=list)


class CompanyVerifier:
    """Company verification and enrichment (CIPC-ready)."""
    
    # Known verified companies (cache/database in production)
    KNOWN_COMPANIES = {
        'capitec bank': {'verified': True, 'industry': 'Banking'},
        'fnb': {'verified': True, 'industry': 'Banking'},
        'absa': {'verified': True, 'industry': 'Banking'},
        'standard bank': {'verified': True, 'industry': 'Banking'},
        'nedbank': {'verified': True, 'industry': 'Banking'},
        'vodacom': {'verified': True, 'industry': 'Telecommunications'},
        'mtn': {'verified': True, 'industry': 'Telecommunications'},
        'shoprite': {'verified': True, 'industry': 'Retail'},
        'pick n pay': {'verified': True, 'industry': 'Retail'},
        'woolworths': {'verified': True, 'industry': 'Retail'},
    }
    
    # Suspicious company name patterns
    SUSPICIOUS_PATTERNS = [
        (r'^confidential$', "Company name hidden"),
        (r'^private$', "Company name hidden"),
        (r'^anonymous$', "Company name hidden"),
        (r'^n/a$', "Company name missing"),
        (r'hiring.*agency', "Possibly recruitment agency"),
    ]
    
    @classmethod
    def verify(cls, company_name: str) -> CompanyInfo:
        """Verify and enrich company information."""
        if not company_name:
            return CompanyInfo(warnings=["No company name provided"])
        
        result = CompanyInfo(name=company_name)
        result.normalized_name = FuzzyDeduplicator.normalize_company(company_name)
        
        # Check known companies
        if result.normalized_name.lower() in cls.KNOWN_COMPANIES:
            info = cls.KNOWN_COMPANIES[result.normalized_name.lower()]
            result.is_verified = info['verified']
            result.industry = info.get('industry')
            result.trust_score = 0.9
            result.verification_source = 'known_database'
            return result
        
        # Check suspicious patterns
        for pattern, warning in cls.SUSPICIOUS_PATTERNS:
            if re.search(pattern, company_name.lower()):
                result.warnings.append(warning)
                result.trust_score = 0.3
        
        # Government department detection
        if 'department' in company_name.lower() or company_name.lower().endswith(('.gov.za', 'government')):
            result.is_verified = True
            result.industry = 'Government'
            result.trust_score = 0.85
            result.verification_source = 'government_pattern'
        
        return result


# ============================================================================
# ENHANCEMENT 10: APPLICATION METHOD INTELLIGENCE
# ============================================================================

@dataclass
class ApplicationMethod:
    """Application method analysis result."""
    method_type: str = "unknown"  # email, portal, whatsapp, walk_in, multi_step
    primary_contact: Optional[str] = None  # email address or URL
    instructions: Optional[str] = None
    is_suspicious: bool = False
    warnings: List[str] = field(default_factory=list)


class ApplicationMethodAnalyzer:
    """Analyze and classify application methods."""
    
    EMAIL_PATTERN = r'[\w\.-]+@[\w\.-]+\.\w+'
    URL_PATTERN = r'https?://[^\s<>"\']+|www\.[^\s<>"\']+'
    WHATSAPP_PATTERN = r'whatsapp.*?(\+?\d[\d\s\-]{8,})'
    
    @classmethod
    def analyze(cls, text: str, email: str = None, url: str = None) -> ApplicationMethod:
        """Analyze application method from text."""
        result = ApplicationMethod()
        text_lower = text.lower() if text else ""
        
        # Email application
        if email or re.search(cls.EMAIL_PATTERN, text):
            result.method_type = "email"
            result.primary_contact = email or re.search(cls.EMAIL_PATTERN, text).group()
            
            # Check for personal email domains
            if result.primary_contact:
                domain = result.primary_contact.split('@')[-1].lower()
                if domain in ['gmail.com', 'yahoo.com', 'hotmail.com']:
                    result.warnings.append("Personal email domain used")
                    result.is_suspicious = True
        
        # Portal/website application
        elif url or re.search(cls.URL_PATTERN, text):
            result.method_type = "portal"
            result.primary_contact = url or re.search(cls.URL_PATTERN, text).group()
        
        # WhatsApp (suspicious)
        elif 'whatsapp' in text_lower:
            result.method_type = "whatsapp"
            match = re.search(cls.WHATSAPP_PATTERN, text, re.IGNORECASE)
            if match:
                result.primary_contact = match.group(1)
            result.is_suspicious = True
            result.warnings.append("WhatsApp-only applications are uncommon for legitimate jobs")
        
        # Walk-in
        elif any(kw in text_lower for kw in ['walk in', 'walk-in', 'in person', 'hand deliver']):
            result.method_type = "walk_in"
        
        # Multi-step
        if 'register' in text_lower and ('then' in text_lower or 'after' in text_lower):
            result.method_type = "multi_step"
            result.instructions = "Multiple steps required"
        
        return result


# ============================================================================
# MAIN PROCESSOR - COMBINES ALL ENHANCEMENTS
# ============================================================================

class EnhancedOpportunityProcessor:
    """Main processor that applies all 10 enhancements."""
    
    @classmethod
    def process(cls, raw_data: Dict) -> Dict:
        """Process raw opportunity data with all enhancements."""
        result = raw_data.copy()
        
        description = raw_data.get('description', '') or ''
        title = raw_data.get('title', '') or ''
        company = raw_data.get('company', '') or ''
        
        # 1. Salary parsing
        salary_text = raw_data.get('salary_text', '') or description
        salary = SalaryParser.parse(salary_text, raw_data.get('experience_level'))
        result['salary_min'] = salary.salary_min
        result['salary_max'] = salary.salary_max
        result['salary_type'] = salary.salary_type
        result['is_stipend'] = salary.is_stipend
        result['salary_warnings'] = salary.warnings
        
        # 2. Experience classification
        experience = ExperienceClassifier.classify(description, title)
        result['experience_level'] = experience['level']
        result['experience_years_min'] = experience['years_min']
        result['experience_years_max'] = experience['years_max']
        
        # 3. Scam detection
        scam = ScamDetector.analyze(description, raw_data.get('contact_email'), company)
        result['scam_score'] = scam.scam_score
        result['scam_risk_level'] = scam.risk_level
        result['red_flags'] = scam.red_flags
        result['scam_recommendation'] = scam.recommendation
        
        # 4. Deadline parsing
        deadline_text = raw_data.get('deadline_text', '') or description
        deadline = DeadlineParser.parse(deadline_text)
        result['application_deadline'] = deadline.deadline_date
        result['deadline_type'] = deadline.deadline_type
        result['is_expired'] = deadline.is_expired
        
        # 5. Location parsing
        location_text = raw_data.get('location_text', '') or raw_data.get('location', '')
        location = LocationParser.parse(location_text)
        result['location'] = {
            'city': location.city,
            'province': location.province,
            'country': location.country,
            'latitude': location.latitude,
            'longitude': location.longitude,
        }
        result['work_arrangement'] = location.work_arrangement
        
        # 6. Skills extraction
        skills = SkillsExtractor.extract(description)
        result['skills_extracted'] = skills['skills']
        result['skill_categories'] = skills['categories']
        result['soft_skills'] = skills['soft_skills']
        
        # 7. Quality scoring
        quality = QualityScorer.score(result)
        result['quality_score'] = quality.overall_score
        result['quality_badge'] = quality.badge
        result['quality_issues'] = quality.issues
        
        # 8. Company verification
        company_info = CompanyVerifier.verify(company)
        result['company_verified'] = company_info.is_verified
        result['company_industry'] = company_info.industry
        result['company_trust_score'] = company_info.trust_score
        
        # 9. Application method
        app_method = ApplicationMethodAnalyzer.analyze(
            description,
            raw_data.get('contact_email'),
            raw_data.get('application_url')
        )
        result['application_method'] = app_method.method_type
        result['application_warnings'] = app_method.warnings
        
        # 10. Deduplication hash
        result['dedup_key'] = f"{FuzzyDeduplicator.normalize_company(company)}_{title.lower()[:50]}"
        
        return result
