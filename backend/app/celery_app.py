"""
Celery Configuration for Proofile

Background task processing for:
- Document OCR processing
- Email sending (OTP, peer verification)
- Trust score recalculation
- Job portal scraping
"""
from celery import Celery
from celery.schedules import crontab
import os
from app.core.config import settings

# Configure Celery broker and backend
broker = os.getenv("CELERY_BROKER_URL", settings.REDIS_URL)
backend = os.getenv("CELERY_RESULT_BACKEND", settings.REDIS_URL)

celery_app = Celery(
    "proofile_worker",
    broker=broker,
    backend=backend,
    include=[
        "app.tasks.verification",
        "app.tasks.ratings",
        "app.tasks.portal_scraper",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Johannesburg",  # SA timezone
    enable_utc=True,
    task_default_queue="default",
    task_queues={
        "default": {"exchange": "default", "routing_key": "default"},
        "documents": {"exchange": "documents", "routing_key": "documents"},
        "emails": {"exchange": "emails", "routing_key": "emails"},
        "scrapers": {"exchange": "scrapers", "routing_key": "scrapers"},
    },
    task_routes={
        # Verification tasks
        "app.tasks.verification.process_document_ocr": {"queue": "documents"},
        "app.tasks.verification.send_otp_email": {"queue": "emails"},
        "app.tasks.verification.send_peer_verification_email": {"queue": "emails"},
        # Portal scraper tasks
        "scrape_careers24": {"queue": "scrapers"},
        "scrape_pnet": {"queue": "scrapers"},
        "scrape_indeed": {"queue": "scrapers"},
        "scrape_portal_jobs": {"queue": "scrapers"},
        "scrape_all_sources": {"queue": "scrapers"},
        "cleanup_expired_jobs": {"queue": "scrapers"},
        "update_job_stats": {"queue": "scrapers"},
    },
    # Task settings
    task_acks_late=True,  # For reliability
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # One task at a time for slow OCR
    
    # ==================== CELERY BEAT SCHEDULE ====================
    # Scheduled tasks for automated job scraping
    beat_schedule={
        # Scrape all job sources every 6 hours
        "scrape-all-sources-every-6-hours": {
            "task": "scrape_all_sources",
            "schedule": 6 * 60 * 60,  # Every 6 hours (21600 seconds)
            "args": (2,),  # Scrape 2 pages per source
            "options": {"queue": "scrapers"},
        },
        
        # Scrape Careers24 tech jobs every 4 hours
        "scrape-careers24-tech": {
            "task": "scrape_careers24",
            "schedule": 4 * 60 * 60,  # Every 4 hours
            "kwargs": {"category": "technology", "pages": 3},
            "options": {"queue": "scrapers"},
        },
        
        # Scrape PNet developer jobs every 4 hours
        "scrape-pnet-developers": {
            "task": "scrape_pnet",
            "schedule": 4 * 60 * 60,  # Every 4 hours
            "kwargs": {"keyword": "developer", "pages": 3},
            "options": {"queue": "scrapers"},
        },
        
        # Cleanup expired jobs daily at 2 AM
        "cleanup-expired-jobs-daily": {
            "task": "cleanup_expired_jobs",
            "schedule": crontab(hour=2, minute=0),  # 2:00 AM daily
            "options": {"queue": "scrapers"},
        },
        
        # Update job stats every hour
        "update-job-stats-hourly": {
            "task": "update_job_stats",
            "schedule": 60 * 60,  # Every hour
            "options": {"queue": "scrapers"},
        },
        
        # Recalculate trust scores daily at 3 AM
        "recalculate-trust-scores-daily": {
            "task": "recalculate_trust_score",
            "schedule": crontab(hour=3, minute=0),
            "options": {"queue": "default"},
        },
    },
    
    # Beat scheduler settings
    beat_scheduler="celery.beat:PersistentScheduler",
    beat_schedule_filename="/tmp/celerybeat-schedule",
)


@celery_app.task
def ping():
    """Health check task."""
    return "pong"

