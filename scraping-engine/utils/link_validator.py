"""
Link Validator Utility
======================
Validates and extracts canonical links from scraped opportunities.
Ensures users are directed to actual company pages, not aggregator sites.
"""

from urllib.parse import urlparse, urljoin
from typing import Optional, Tuple
import re
import logging

logger = logging.getLogger(__name__)

# Known aggregator domains that should NOT be used as canonical links
AGGREGATOR_DOMAINS = [
    'studentroom.co.za',
    'recentjobs.co.za',
    'puffandpass.co.za',
    'pnet.co.za',
    'careerjunction.co.za',
    'indeed.co.za',
    'gumtree.co.za',
    'indeed.com',
    'gumtree.co.za',
    'jobvine.co.za',
    'careers24.com',
    'simplyhired.co.za',
    'jobisite.com',
    'glassdoor.com',
    'linkedin.com',  # Unless it's a direct company careers link
    'facebook.com',  # Unless it's a company page
    'jobleads.co.za',
    'adzuna.co.za',
    'bestjobs.co.za',
    'job-sa.com',
    'job.web.za',
    'recruit.net',
    'jobweb.co.za',
    # Social media platforms (should never be canonical links)
    'twitter.com',
    'x.com',
    'instagram.com',
    'tiktok.com',
    'pinterest.com',
    'youtube.com',
    'whatsapp.com',
    'wa.me',
]

# Domains that are always valid company sites (government, major employers)
TRUSTED_COMPANY_DOMAINS = [
    '.gov.za',
    '.ac.za',  # Universities
    '.edu.za',
    'standardbank.co.za',
    'fnb.co.za',
    'absa.co.za',
    'nedbank.co.za',
    'capitecbank.co.za',  # Added: Capitec Bank
    'investec.com',  # Added: Investec
    'africanbank.co.za',  # Added: African Bank
    'tymedigital.co.za',  # Added: TymeBank/TymeDigital
    'bankzero.co.za',  # Added: Bank Zero
    'discovery.co.za',
    'vodacom.co.za',
    'mtn.co.za',
    'telkom.co.za',
    'eskom.co.za',
    'transnet.net',
    'sars.gov.za',
    'sappi.com',
    'sasol.com',
    'anglo.com',
    'deloitte.com',
    'pwc.co.za',
    'kpmg.co.za',
    'ey.com',
    'accenture.com',
    'microsoft.com',
    'google.com',
    'amazon.com',
    # ATS (Applicant Tracking Systems) platforms
    'smartrecruiters.com',
    'workday.com',
    'successfactors.com',
    'taleo.net',
    'icims.com',
    'greenhouse.io',
    'lever.co',
]


# URL path patterns that indicate a careers/job page
COMPANY_CAREER_PATTERNS = [
    r'/careers?',
    r'/jobs?',
    r'/vacancies',
    r'/opportunities',
    r'/join-us',
    r'/work-with-us',
    r'/employment',
    r'/hiring',
    r'/apply',
    r'/positions',
    r'/openings',
    r'/recruit',
]

# Patterns that indicate a SPECIFIC job posting (not just a listings page)
SPECIFIC_JOB_PATTERNS = [
    r'/job/\d+',           # /job/12345
    r'/vacancy/\d+',       # /vacancy/12345
    r'/position/\d+',      # /position/12345
    r'/careers?/[^/]+$',   # /careers/software-developer
    r'/jobs?/[^/]+$',      # /jobs/data-analyst
    r'/apply/[^/]+',       # /apply/job-title
    r'[?&]id=\d+',         # ?id=12345
    r'[?&]jobId=\d+',      # ?jobId=12345
    r'[?&]ref=',           # ?ref=ABC123
    r'/requisition/',      # ATS URLs
    r'/posting/',          # Job posting URLs
    r'-\d{4,}',            # job-title-12345 (job ID at end)
]


def is_aggregator_domain(url: str) -> bool:
    """
    Check if URL belongs to a known aggregator domain.
    
    Args:
        url: The URL to check
        
    Returns:
        True if URL is from an aggregator domain
    """
    try:
        domain = urlparse(url).netloc.lower()
        
        for aggregator in AGGREGATOR_DOMAINS:
            if aggregator in domain:
                return True
        
        return False
    except Exception:
        return True  # Assume aggregator if we can't parse


def is_trusted_company_domain(url: str) -> bool:
    """
    Check if URL is from a known trusted company domain.
    
    Args:
        url: The URL to check
        
    Returns:
        True if URL is from a trusted company domain
    """
    try:
        domain = urlparse(url).netloc.lower()
        
        for trusted in TRUSTED_COMPANY_DOMAINS:
            if trusted in domain:
                return True
        
        return False
    except Exception:
        return False


def has_career_path(url: str) -> bool:
    """
    Check if URL path indicates a careers/jobs page.
    
    Args:
        url: The URL to check
        
    Returns:
        True if URL path matches career patterns
    """
    try:
        path = urlparse(url).path.lower()
        
        for pattern in COMPANY_CAREER_PATTERNS:
            if re.search(pattern, path):
                return True
        
        return False
    except Exception:
        return False


def is_specific_job_url(url: str) -> bool:
    """
    Check if URL points to a SPECIFIC job posting (not just a listings page).
    
    Specific job URLs have identifiers like:
    - /jobs/12345
    - /careers/software-developer-johannesburg
    - ?jobId=ABC123
    
    Generic pages we want to AVOID:
    - /careers (listings page)
    - /jobs (listings page)  
    - / (homepage)
    
    Args:
        url: The URL to check
        
    Returns:
        True if URL is a specific job posting
    """
    if not url:
        return False
    
    try:
        parsed = urlparse(url)
        path = parsed.path.lower()
        query = parsed.query.lower()
        full_url = url.lower()
        
        # Check for specific job patterns
        for pattern in SPECIFIC_JOB_PATTERNS:
            if re.search(pattern, full_url):
                return True
        
        # A path with 3+ segments is likely specific (e.g., /careers/it/developer)
        path_segments = [s for s in path.split('/') if s]
        if len(path_segments) >= 3:
            return True
        
        # A path with query parameters is often specific
        if query and len(query) > 5:
            return True
        
        return False
    except Exception:
        return False


def is_generic_page(url: str) -> bool:
    """
    Check if URL is a generic page we should AVOID replacing specific job URLs with.
    
    Generic pages:
    - Homepage (/)
    - Main careers listing (/careers, /jobs)
    - Contact pages (/contact)
    
    Args:
        url: The URL to check
        
    Returns:
        True if URL is a generic page
    """
    if not url:
        return True
    
    try:
        path = urlparse(url).path.lower().strip('/')
        
        # Very short paths are generic
        if len(path) < 3:
            return True
        
        # Single-word paths are often listings pages
        generic_paths = [
            'careers', 'jobs', 'vacancies', 'opportunities',
            'contact', 'about', 'home', 'index'
        ]
        
        if path in generic_paths:
            return True
        
        return False
    except Exception:
        return True


def is_canonical_link(url: str) -> bool:
    """
    Determine if URL points to an actual company page vs aggregator.
    
    A canonical link is one that:
    1. Is NOT from a known aggregator domain
    2. Ideally is from a trusted company domain OR has career-related path
    
    Args:
        url: The URL to validate
        
    Returns:
        True if link is to company page, False if aggregator
    """
    if not url:
        return False
    
    # Definitely an aggregator
    if is_aggregator_domain(url):
        return False
    
    # Definitely a company
    if is_trusted_company_domain(url):
        return True
    
    # Check for career page patterns (strong indicator)
    if has_career_path(url):
        return True
    
    # If not an aggregator and has a domain that looks corporate, likely OK
    try:
        domain = urlparse(url).netloc.lower()
        # Must have a proper domain (not localhost, not IP)
        if '.' in domain and not domain.startswith('192.') and not domain.startswith('127.'):
            return True
    except Exception:
        pass
    
    return False


def extract_email_domain(email: str) -> Optional[str]:
    """
    Extract domain from email address for company website lookup.
    
    Args:
        email: Email address (e.g., hr@company.co.za)
        
    Returns:
        Domain (e.g., company.co.za) or None
    """
    if not email or '@' not in email:
        return None
    
    try:
        # Handle mailto: prefix
        if email.startswith('mailto:'):
            email = email.replace('mailto:', '')
        
        # Get domain part
        domain = email.split('@')[1].strip()
        
        # Remove common prefixes
        if domain.startswith('www.'):
            domain = domain[4:]
        
        return domain
    except Exception:
        return None


def construct_company_careers_url(domain: str) -> str:
    """
    Attempt to construct a careers URL from company domain.
    
    Args:
        domain: Company domain (e.g., company.co.za)
        
    Returns:
        Best guess at careers page URL
    """
    return f"https://www.{domain}/careers"


def extract_best_link(response, item: dict) -> Tuple[str, str]:
    """
    Extract the best canonical link from a Scrapy response.
    
    Priority:
    1. Direct application link (external, to company career page)
    2. External link in job description
    3. Email domain → company website
    4. Fallback: aggregator page (marked as low quality)
    
    Args:
        response: Scrapy response object
        item: Current item dict (may be modified to add link_quality)
        
    Returns:
        Tuple of (canonical_link, link_quality)
    """
    base_url = response.url
    
    # Strategy 1: Look for explicit "Apply" buttons with external links
    apply_selectors = [
        'a.apply-button::attr(href)',
        'a.apply-btn::attr(href)',
        'a[class*="apply"]::attr(href)',
        'a[href*="apply"]::attr(href)',
        'button[onclick*="http"]::attr(onclick)',  # Some sites use onclick
        '.apply-link a::attr(href)',
        '#apply-button::attr(href)',
    ]
    
    for selector in apply_selectors:
        links = response.css(selector).getall()
        for link in links:
            # Handle onclick with URL
            if 'http' in link and 'window.location' in link:
                match = re.search(r"https?://[^\s'\"]+", link)
                if match:
                    link = match.group(0)
            
            full_link = urljoin(base_url, link)
            if is_canonical_link(full_link):
                logger.info(f"Found canonical link via apply button: {full_link}")
                return full_link, 'direct_apply'
    
    # Strategy 2: Look for links in "How to Apply" section (CONTEXT-AWARE)
    # This is critical for aggregator sites that embed application links in instructions
    page_text = ' '.join(response.css('*::text').getall())
    how_to_apply_pattern = re.compile(
        r'(how\s+to\s+apply|application\s+(?:process|method|instructions?)|apply\s+(?:now|here)|click\s+here\s+to\s+apply)',
        re.IGNORECASE
    )
    
    # Find all links and check if they appear near "How to Apply" text
    all_links_with_text = response.css('a[href^="http"]')
    context_scored_links = []
    
    for link_element in all_links_with_text:
        link_url = link_element.css('::attr(href)').get()
        link_text = ''.join(link_element.css('::text').getall()).strip()
        
        if not link_url or not is_canonical_link(link_url) or link_url == base_url:
            continue
        
        # Get surrounding text (preceding sibling text nodes)
        preceding_text = ''
        try:
            # Get parent element and extract text before the link
            parent = link_element.xpath('parent::*')
            if parent:
                parent_text = ''.join(parent.css('::text').getall())
                preceding_text = parent_text[:500]  # Last 500 chars before link
        except Exception:
            pass
        
        # Score based on context
        context_score = 0
        combined_context = f"{preceding_text} {link_text}".lower()
        
        # High score if near "How to Apply" text
        if how_to_apply_pattern.search(combined_context):
            context_score += 100
        
        # Score based on link text
        if any(kw in link_text.lower() for kw in ['apply', 'application', 'click here', 'submit', 'portal']):
            context_score += 50
        
        # Score based on URL quality
        if is_specific_job_url(link_url):
            context_score += 30
        elif has_career_path(link_url):
            context_score += 20
        
        context_scored_links.append((link_url, context_score, link_text))
    
    # Return highest scoring link from context analysis
    if context_scored_links:
        context_scored_links.sort(key=lambda x: x[1], reverse=True)
        best_link, score, text = context_scored_links[0]
        if score >= 50:  # Minimum threshold
            logger.info(f"Found context-aware link (score={score}): {best_link} (text: '{text}')")
            return best_link, 'context_aware_link'
    
    # Strategy 3: Look for external links in job description (fallback)
    description_selectors = [
        '.job-description a[href^="http"]::attr(href)',
        '.description a[href^="http"]::attr(href)',
        '#job-details a[href^="http"]::attr(href)',
        '.content a[href^="http"]::attr(href)',
        '.entry-content a[href^="http"]::attr(href)',
        'article a[href^="http"]::attr(href)',
    ]
    
    for selector in description_selectors:
        links = response.css(selector).getall()
        for link in links:
            if is_canonical_link(link) and link != base_url:
                logger.info(f"Found canonical link in description: {link}")
                return link, 'description_link'
    
    # Strategy 4: Look for company website link
    website_selectors = [
        'a[class*="website"]::attr(href)',
        'a[class*="company-link"]::attr(href)',
        '.company-info a[href^="http"]::attr(href)',
    ]
    
    for selector in website_selectors:
        links = response.css(selector).getall()
        for link in links:
            if is_canonical_link(link):
                logger.info(f"Found company website: {link}")
                return link, 'company_website'
    
    # Strategy 5: Check if any external link is not an aggregator
    # PRIORITIZE specific job URLs over generic pages
    specific_job_links = []
    generic_career_links = []
    
    all_links = response.css('a[href^="http"]::attr(href)').getall()
    for link in all_links:
        if is_canonical_link(link) and link != base_url:
            if is_specific_job_url(link):
                specific_job_links.append(link)
            elif has_career_path(link) and not is_generic_page(link):
                generic_career_links.append(link)
    
    # Return the most specific link found
    if specific_job_links:
        best_link = specific_job_links[0]
        logger.info(f"Found specific job URL: {best_link}")
        return best_link, 'specific_job_link'
    
    if generic_career_links:
        best_link = generic_career_links[0]
        logger.info(f"Found career page link: {best_link}")
        return best_link, 'career_page_link'
    
    # Strategy 6: Extract email for REFERENCE only (don't construct URLs)
    # We'll note the email domain but NOT redirect to generic homepage
    email_selectors = [
        'a[href^="mailto:"]::attr(href)',
        '[class*="email"]::text',
    ]
    
    email_domain = None
    for selector in email_selectors:
        emails = response.css(selector).getall()
        for email in emails:
            domain = extract_email_domain(email)
            if domain and not is_aggregator_domain(f"https://{domain}"):
                email_domain = domain
                break
        if email_domain:
            break
    
    # Fallback: use current page (aggregator) but note we found email domain
    if email_domain:
        logger.warning(
            f"No specific job link found. Email domain: {email_domain}. "
            f"Using aggregator URL: {base_url}"
        )
        return base_url, 'aggregator_with_email_hint'
    
    logger.warning(f"No canonical link found, using aggregator URL: {base_url}")
    return base_url, 'aggregator_fallback'


def validate_link_for_frontend(canonical_link: str, source_url: str) -> dict:
    """
    Validate a link before showing to users on frontend.
    
    Returns metadata about link quality for display decisions.
    
    Args:
        canonical_link: The link we would show to users
        source_url: Original URL where we found this opportunity
        
    Returns:
        Dict with validation results
    """
    is_valid = is_canonical_link(canonical_link)
    is_same_as_source = canonical_link == source_url
    
    return {
        'canonical_link': canonical_link,
        'is_company_link': is_valid,
        'is_aggregator': not is_valid,
        'is_same_as_source': is_same_as_source,
        'quality_score': 1.0 if is_valid else 0.3,
        'warning': None if is_valid else 'This link may redirect to an aggregator page',
        'recommendation': 'show' if is_valid else 'show_with_warning',
    }


# Convenience function for pipeline integration
def process_opportunity_link(item: dict, response=None) -> dict:
    """
    Process an opportunity item to ensure proper link quality.
    
    Can be used in Scrapy pipelines or post-processing.
    
    Args:
        item: Opportunity item dict
        response: Optional Scrapy response for re-extraction
        
    Returns:
        Item with enhanced link metadata
    """
    current_link = item.get('canonical_link') or item.get('url')
    source_url = item.get('source_url') or item.get('url')
    
    # If we have a response, try to extract better link
    if response:
        best_link, quality = extract_best_link(response, item)
        item['canonical_link'] = best_link
        item['link_quality'] = quality
        item['source_url'] = source_url
    else:
        # Just validate existing link
        item['is_direct_company_link'] = is_canonical_link(current_link)
        item['link_quality'] = 'validated' if item['is_direct_company_link'] else 'aggregator_fallback'
    
    # Add frontend validation metadata
    item['link_validation'] = validate_link_for_frontend(
        item.get('canonical_link', current_link),
        source_url
    )
    
    return item
