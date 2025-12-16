"""
Text Filter - LLM-based content moderation

Filters review text for:
- Hate speech
- Personal attacks
- PII (phone numbers, addresses, SSN)
- Profanity
- Spam patterns
"""

import re
import logging
from typing import Tuple, List, Optional

logger = logging.getLogger(__name__)


# PII Patterns
PII_PATTERNS = {
    "phone": re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"),
    "address": re.compile(r"\d+\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct)\b", re.IGNORECASE),
}

# Banned words and phrases
BANNED_PATTERNS = [
    # Hate speech patterns
    re.compile(r"\b(hate|kill|die|threat)\b", re.IGNORECASE),
    # Slurs and offensive terms
    re.compile(r"\b(idiot|moron|stupid)\b", re.IGNORECASE),
]

# Spam indicators
SPAM_PATTERNS = [
    re.compile(r"(click here|visit now|limited time)", re.IGNORECASE),
    re.compile(r"https?://", re.IGNORECASE),
    re.compile(r"(.)\1{4,}"),  # Repeated characters (e.g., "aaaaaaa")
]


class TextFilterResult:
    """Result of text filtering."""
    
    def __init__(
        self,
        is_clean: bool,
        filtered_text: str,
        flags: List[str],
        pii_found: List[str],
        severity: str
    ):
        self.is_clean = is_clean
        self.filtered_text = filtered_text
        self.flags = flags
        self.pii_found = pii_found
        self.severity = severity  # "low", "medium", "high"


def detect_pii(text: str) -> List[str]:
    """
    Detect personally identifiable information in text.
    
    Returns list of PII types found.
    """
    found = []
    
    for pii_type, pattern in PII_PATTERNS.items():
        if pattern.search(text):
            found.append(pii_type)
    
    return found


def redact_pii(text: str) -> str:
    """
    Redact PII from text with placeholders.
    """
    result = text
    
    replacements = {
        "phone": "[PHONE REDACTED]",
        "email": "[EMAIL REDACTED]",
        "ssn": "[SSN REDACTED]",
        "credit_card": "[CARD REDACTED]",
        "address": "[ADDRESS REDACTED]",
    }
    
    for pii_type, pattern in PII_PATTERNS.items():
        result = pattern.sub(replacements[pii_type], result)
    
    return result


def check_banned_content(text: str) -> List[str]:
    """
    Check for banned words and phrases.
    
    Returns list of flags.
    """
    flags = []
    
    for pattern in BANNED_PATTERNS:
        if pattern.search(text):
            flags.append("banned_content")
            break
    
    return flags


def check_spam(text: str) -> List[str]:
    """
    Check for spam patterns.
    
    Returns list of flags.
    """
    flags = []
    
    for pattern in SPAM_PATTERNS:
        if pattern.search(text):
            flags.append("spam_detected")
            break
    
    # Check for all caps (shouting)
    if len(text) > 20 and text.upper() == text:
        flags.append("all_caps")
    
    return flags


def filter_text(text: str, auto_redact_pii: bool = True) -> TextFilterResult:
    """
    Main text filtering function.
    
    Args:
        text: Text to filter
        auto_redact_pii: Whether to automatically redact PII
        
    Returns:
        TextFilterResult with filtering results
    """
    if not text:
        return TextFilterResult(
            is_clean=True,
            filtered_text="",
            flags=[],
            pii_found=[],
            severity="low"
        )
    
    flags = []
    filtered_text = text
    
    # Check for PII
    pii_found = detect_pii(text)
    if pii_found:
        flags.append("pii_detected")
        if auto_redact_pii:
            filtered_text = redact_pii(text)
    
    # Check for banned content
    banned_flags = check_banned_content(text)
    flags.extend(banned_flags)
    
    # Check for spam
    spam_flags = check_spam(text)
    flags.extend(spam_flags)
    
    # Determine severity
    if "banned_content" in flags:
        severity = "high"
    elif pii_found or "spam_detected" in flags:
        severity = "medium"
    else:
        severity = "low"
    
    is_clean = len(flags) == 0
    
    logger.info(f"Text filter result: clean={is_clean}, flags={flags}, severity={severity}")
    
    return TextFilterResult(
        is_clean=is_clean,
        filtered_text=filtered_text,
        flags=flags,
        pii_found=pii_found,
        severity=severity
    )


async def moderate_with_llm(text: str) -> TextFilterResult:
    """
    Use LLM (OpenAI) for advanced content moderation.
    
    This is a placeholder - in production, would call OpenAI's moderation API.
    """
    # First run basic filtering
    basic_result = filter_text(text)
    
    if not basic_result.is_clean:
        return basic_result
    
    # TODO: Call OpenAI moderation API
    # response = await openai.Moderation.create(input=text)
    # if response.results[0].flagged:
    #     return TextFilterResult(...)
    
    return basic_result
