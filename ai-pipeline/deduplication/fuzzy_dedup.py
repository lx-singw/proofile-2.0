"""
Enhanced Fuzzy Deduplication
============================
Implements multi-level deduplication:
- URL-based exact matching (fast)
- Title + Company fingerprint matching (medium)
- Fuzzy title similarity matching (slow but thorough)
"""
import hashlib
import logging
import os
import re
from typing import Optional

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

# Configuration
DEDUP_TTL = int(os.getenv("DEDUP_TTL", str(7 * 24 * 3600)))  # 7 days
FUZZY_SIMILARITY_THRESHOLD = float(os.getenv("FUZZY_SIMILARITY_THRESHOLD", "0.85"))

# Redis keys
URL_SEEN_KEY = "dedup:urls"
FINGERPRINT_SEEN_KEY = "dedup:fingerprints"
TITLE_HASHES_KEY = "dedup:title_hashes"


def normalize_text(text: str) -> str:
    """Normalize text for comparison."""
    if not text:
        return ""
    # Lowercase
    text = text.lower()
    # Remove year references (2024, 2025, etc.)
    text = re.sub(r'\b20\d{2}\b', '', text)
    # Remove common suffixes
    text = re.sub(r'\b(programme?|program|internship|learnership|bursary|vacancy|position)\b', '', text)
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def normalize_company(company: str) -> str:
    """Normalize company name for comparison."""
    if not company:
        return ""
    company = company.lower()
    # Remove common suffixes
    company = re.sub(r'\b(pty|ltd|limited|inc|corporation|corp|co|company)\b', '', company)
    company = re.sub(r'[^\w\s]', '', company)
    company = re.sub(r'\s+', ' ', company).strip()
    return company


def generate_fingerprint(title: str, company: str) -> str:
    """Generate a fingerprint from title and company."""
    norm_title = normalize_text(title)
    norm_company = normalize_company(company)
    combined = f"{norm_title}|{norm_company}"
    return hashlib.md5(combined.encode()).hexdigest()


def generate_title_hash(title: str) -> str:
    """Generate a hash of normalized title for fuzzy matching."""
    norm_title = normalize_text(title)
    # Take first 50 chars for comparison (catches most duplicates)
    return hashlib.md5(norm_title[:50].encode()).hexdigest()[:16]


def simple_similarity(s1: str, s2: str) -> float:
    """Calculate simple similarity ratio between two strings."""
    if not s1 or not s2:
        return 0.0
    
    s1_norm = normalize_text(s1)
    s2_norm = normalize_text(s2)
    
    if s1_norm == s2_norm:
        return 1.0
    
    # Simple word overlap similarity
    words1 = set(s1_norm.split())
    words2 = set(s2_norm.split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1 & words2
    union = words1 | words2
    
    return len(intersection) / len(union)


class EnhancedDeduplicator:
    """
    Multi-level deduplication service.
    
    Levels:
    1. URL exact match (fastest)
    2. Title + Company fingerprint (fast)
    3. Title similarity (slower, optional)
    """
    
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
    
    async def is_duplicate(
        self,
        url: str,
        title: str,
        company: str,
        check_fuzzy: bool = True
    ) -> tuple[bool, str]:
        """
        Check if an opportunity is a duplicate.
        
        Returns:
            (is_duplicate, reason)
        """
        # Level 1: URL exact match
        if url:
            if await self.redis.sismember(URL_SEEN_KEY, url):
                return True, "url_exact"
        
        # Level 2: Fingerprint match
        fingerprint = generate_fingerprint(title, company)
        if await self.redis.sismember(FINGERPRINT_SEEN_KEY, fingerprint):
            return True, "fingerprint"
        
        # Level 3: Fuzzy title match (optional, more expensive)
        if check_fuzzy and title:
            title_hash = generate_title_hash(title)
            # Check if similar title exists
            existing_titles = await self.redis.hgetall(TITLE_HASHES_KEY)
            for stored_hash, stored_title in existing_titles.items():
                if isinstance(stored_title, bytes):
                    stored_title = stored_title.decode()
                similarity = simple_similarity(title, stored_title)
                if similarity >= FUZZY_SIMILARITY_THRESHOLD:
                    return True, f"fuzzy_title:{similarity:.2f}"
        
        return False, ""
    
    async def mark_seen(self, url: str, title: str, company: str) -> None:
        """Mark an opportunity as seen."""
        pipe = self.redis.pipeline()
        
        # Mark URL
        if url:
            pipe.sadd(URL_SEEN_KEY, url)
            pipe.expire(URL_SEEN_KEY, DEDUP_TTL)
        
        # Mark fingerprint
        fingerprint = generate_fingerprint(title, company)
        pipe.sadd(FINGERPRINT_SEEN_KEY, fingerprint)
        pipe.expire(FINGERPRINT_SEEN_KEY, DEDUP_TTL)
        
        # Store title for fuzzy matching
        if title:
            title_hash = generate_title_hash(title)
            pipe.hset(TITLE_HASHES_KEY, title_hash, title[:100])
            pipe.expire(TITLE_HASHES_KEY, DEDUP_TTL)
        
        await pipe.execute()
    
    async def get_stats(self) -> dict:
        """Get deduplication statistics."""
        url_count = await self.redis.scard(URL_SEEN_KEY)
        fingerprint_count = await self.redis.scard(FINGERPRINT_SEEN_KEY)
        title_count = await self.redis.hlen(TITLE_HASHES_KEY)
        
        return {
            "urls_seen": url_count,
            "fingerprints_seen": fingerprint_count,
            "titles_stored": title_count,
        }


# Convenience functions for direct use
async def check_duplicate(
    redis_client: aioredis.Redis,
    url: str,
    title: str,
    company: str
) -> tuple[bool, str]:
    """Quick check for duplicate."""
    dedup = EnhancedDeduplicator(redis_client)
    return await dedup.is_duplicate(url, title, company)


async def mark_opportunity_seen(
    redis_client: aioredis.Redis,
    url: str,
    title: str,
    company: str
) -> None:
    """Mark opportunity as seen."""
    dedup = EnhancedDeduplicator(redis_client)
    await dedup.mark_seen(url, title, company)
