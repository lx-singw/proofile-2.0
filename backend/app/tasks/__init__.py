"""
Celery Tasks Package

Import all task modules here so they are registered with Celery.
"""

from app.tasks.verification import (
    process_document_ocr,
    send_otp_email,
    send_peer_verification_email,
    recalculate_trust_score
)

from app.tasks.ratings import (
    recalculate_reputation,
    send_rating_request_email,
    moderate_rating_content
)

# Portal scraper tasks are optional and currently disabled in MVP.
scrape_careers24 = None
scrape_pnet = None
scrape_indeed = None
scrape_portal_jobs = None
scrape_all_sources = None
cleanup_expired_jobs = None
update_job_stats = None

__all__ = [
    # Verification tasks
    "process_document_ocr",
    "send_otp_email",
    "send_peer_verification_email",
    "recalculate_trust_score",
    # Ratings tasks
    "recalculate_reputation",
    "send_rating_request_email",
    "moderate_rating_content",
    # Portal scraper tasks
    "scrape_careers24",
    "scrape_pnet",
    "scrape_indeed",
    "scrape_portal_jobs",
    "scrape_all_sources",
    "cleanup_expired_jobs",
    "update_job_stats",
]
