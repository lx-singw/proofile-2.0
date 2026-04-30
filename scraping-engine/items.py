import scrapy

class OpportunityItem(scrapy.Item):
    """
    Standard item for all opportunities found by scrapers.
    Used for validation and pipeline processing.
    """
    title = scrapy.Field()
    company = scrapy.Field()
    location = scrapy.Field()
    salary = scrapy.Field()
    original_url = scrapy.Field()  # Legacy field, use canonical_link
    description_short = scrapy.Field()
    description_full = scrapy.Field()
    source_platform = scrapy.Field()
    type = scrapy.Field()  # job, internship, bursary, etc.
    raw_data = scrapy.Field()  # Optional storage for original JSON/HTML
    spider = scrapy.Field()  # Name of the spider that scraped this item
    
    # Enhanced link tracking (Phase 1 of scraping refactor)
    canonical_link = scrapy.Field()  # Best link to company page (not aggregator)
    source_url = scrapy.Field()  # URL where we found this opportunity (aggregator page)
    is_direct_company_link = scrapy.Field()  # True if canonical_link goes to company site
    link_quality = scrapy.Field()  # Quality indicator: direct_apply, description_link, email_derived, aggregator_fallback
    needs_deep_scrape = scrapy.Field()  # True if we should scrape the canonical_link for better data
    
    # Quick Win: Confidence scoring fields
    confidence_score = scrapy.Field()  # 0-100 score based on link quality and data completeness
    quality_tier = scrapy.Field()  # 'high' (80+), 'medium' (50-79), 'low' (<50)
    
    # Additional extracted fields
    closing_date = scrapy.Field()  # Application deadline
    application_deadline = scrapy.Field()  # Alias for closing_date
    application_method = scrapy.Field()  # email, online, in_person, etc.
    contact_email = scrapy.Field()  # Extracted contact email
    contact_phone = scrapy.Field()  # Extracted contact phone
