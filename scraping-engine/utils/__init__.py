"""
Scraping Engine Utilities
"""

from .link_validator import (
    is_canonical_link,
    is_aggregator_domain,
    extract_best_link,
    process_opportunity_link,
    validate_link_for_frontend,
)

__all__ = [
    'is_canonical_link',
    'is_aggregator_domain', 
    'extract_best_link',
    'process_opportunity_link',
    'validate_link_for_frontend',
]
