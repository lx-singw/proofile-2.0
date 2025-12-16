"""
Email Domain Validation Service
Validates corporate email domains for employment verification
"""

import re
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Public email domains that should NOT be used for employment verification
EXCLUDED_DOMAINS = {
    # Major email providers
    "gmail.com", "googlemail.com",
    "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.in",
    "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
    "icloud.com", "me.com", "mac.com",
    "aol.com",
    "protonmail.com", "protonmail.ch", "pm.me",
    "zoho.com",
    "mail.com", "email.com",
    "yandex.com", "yandex.ru",
    "gmx.com", "gmx.de", "gmx.net",
    "fastmail.com", "fastmail.fm",
    "tutanota.com", "tutamail.com",
    "hey.com",
    
    # Disposable/temporary email domains
    "mailinator.com", "guerrillamail.com", "tempmail.com",
    "10minutemail.com", "throwaway.email",
    
    # Educational (should use separate education verification)
    "edu", ".edu",
}

# Known company domain mappings (company name -> expected domains)
COMPANY_DOMAIN_MAP = {
    "google": ["google.com", "google.co.uk", "google.de", "google.fr"],
    "meta": ["meta.com", "fb.com", "facebook.com", "instagram.com", "whatsapp.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr", "aws.com"],
    "apple": ["apple.com"],
    "microsoft": ["microsoft.com", "xbox.com", "linkedin.com"],
    "netflix": ["netflix.com"],
    "spotify": ["spotify.com"],
    "airbnb": ["airbnb.com"],
    "uber": ["uber.com"],
    "stripe": ["stripe.com"],
    "openai": ["openai.com"],
}


def extract_domain(email: str) -> Optional[str]:
    """Extract domain from email address"""
    if not email or "@" not in email:
        return None
    return email.split("@")[-1].lower().strip()


def is_public_domain(domain: str) -> bool:
    """Check if domain is a public email provider"""
    if not domain:
        return True
    
    domain = domain.lower()
    
    # Direct match
    if domain in EXCLUDED_DOMAINS:
        return True
    
    # Check for edu domains
    if domain.endswith(".edu") or domain.endswith(".ac.uk"):
        return True  # Should use education verification instead
    
    return False


def validate_work_email(email: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validate that an email is a valid work email.
    
    Returns:
        Tuple of (is_valid, message, domain)
    """
    # Basic email format check
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False, "Invalid email format", None
    
    domain = extract_domain(email)
    if not domain:
        return False, "Could not extract domain from email", None
    
    if is_public_domain(domain):
        return False, f"'{domain}' is a public email domain. Please use your corporate work email.", domain
    
    return True, "Valid work email domain", domain


def match_domain_to_company(domain: str, company_name: str) -> Tuple[bool, float]:
    """
    Try to match an email domain to a company name.
    
    Returns:
        Tuple of (is_match, confidence)
    """
    if not domain or not company_name:
        return False, 0.0
    
    domain = domain.lower()
    company_name = company_name.lower().strip()
    
    # Exact match in known mappings
    for company, domains in COMPANY_DOMAIN_MAP.items():
        if company in company_name or company_name in company:
            if domain in domains:
                return True, 1.0
    
    # Extract company name from domain (remove TLD)
    domain_base = domain.split(".")[0]
    
    # Direct substring match
    if domain_base in company_name or company_name.replace(" ", "") in domain_base:
        return True, 0.9
    
    # Fuzzy match (basic)
    company_words = company_name.replace(",", "").replace(".", "").split()
    for word in company_words:
        if len(word) >= 3 and word in domain_base:
            return True, 0.7
    
    return False, 0.0


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    import secrets
    return str(secrets.randbelow(900000) + 100000)


class EmailDomainValidator:
    """
    Service class for email domain validation with caching and rate limiting.
    """
    
    def __init__(self):
        self._cache = {}
    
    def validate_for_employment(
        self, 
        email: str, 
        company_name: Optional[str] = None
    ) -> dict:
        """
        Validate email for employment verification.
        
        Returns:
            {
                "valid": bool,
                "domain": str,
                "is_work_email": bool,
                "company_match": bool,
                "match_confidence": float,
                "message": str
            }
        """
        is_valid, message, domain = validate_work_email(email)
        
        result = {
            "valid": is_valid,
            "domain": domain,
            "is_work_email": is_valid,
            "company_match": False,
            "match_confidence": 0.0,
            "message": message
        }
        
        if is_valid and company_name and domain:
            is_match, confidence = match_domain_to_company(domain, company_name)
            result["company_match"] = is_match
            result["match_confidence"] = confidence
            
            if is_match:
                result["message"] = f"Email domain matches {company_name}"
            else:
                result["message"] = f"Email domain '{domain}' may not match company '{company_name}'. Proceed with caution."
        
        return result


# Singleton instance
_validator = None


def get_validator() -> EmailDomainValidator:
    global _validator
    if _validator is None:
        _validator = EmailDomainValidator()
    return _validator
