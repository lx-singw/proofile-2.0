"""
Link Validation Pipeline
========================
Scrapy pipeline that validates and enriches link quality for all items.
Ensures canonical_link points to actual company pages, not aggregators.
"""

import logging
from utils.link_validator import is_canonical_link, validate_link_for_frontend

logger = logging.getLogger(__name__)


class LinkValidationPipeline:
    """
    Pipeline to validate and enrich link quality for all scraped items.
    
    This pipeline:
    1. Validates that canonical_link points to a company page
    2. Falls back to source_url if no good link found
    3. Adds link quality metadata for frontend decisions
    4. Flags items that need deep scraping for better data
    """
    
    def process_item(self, item, spider):
        """Process each item to validate/enhance link quality."""
        
        canonical_link = item.get('canonical_link') or item.get('original_url')
        source_url = item.get('source_url') or item.get('original_url')
        
        # Validate the canonical link
        is_company_link = is_canonical_link(canonical_link) if canonical_link else False
        
        # If canonical link is not a company link, use source URL and flag it
        if not is_company_link:
            logger.warning(
                f"No company link found for '{item.get('title', 'Unknown')[:50]}...' "
                f"- falling back to source URL"
            )
            item['canonical_link'] = source_url
            item['is_direct_company_link'] = False
            item['link_quality'] = item.get('link_quality', 'aggregator_fallback')
        else:
            item['canonical_link'] = canonical_link
            item['is_direct_company_link'] = True
            # Preserve existing quality if set
            if not item.get('link_quality'):
                item['link_quality'] = 'validated'
        
        # Add frontend validation metadata to raw_data
        validation = validate_link_for_frontend(
            item.get('canonical_link', ''),
            source_url or ''
        )
        
        # If item should be deep scraped for better data
        if item.get('is_direct_company_link') and not item.get('needs_deep_scrape'):
            item['needs_deep_scrape'] = True
        
        # Log summary
        if item.get('is_direct_company_link'):
            logger.info(
                f"✓ Company link: {item.get('canonical_link', '')[:50]} "
                f"(quality: {item.get('link_quality', 'unknown')})"
            )
        else:
            logger.warning(
                f"✗ Aggregator fallback: {item.get('canonical_link', '')[:50]}"
            )
        
        return item
