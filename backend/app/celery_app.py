"""
Celery Configuration for Proofile

Background task processing for:
- Document OCR processing
- Email sending (OTP, peer verification)
- Trust score recalculation
"""
from celery import Celery
from celery.schedules import crontab
import os
from app.core.config import settings

# Configure Celery broker and backend
broker = os.getenv("CELERY_BROKER_URL", settings.REDIS_URL)
backend = os.getenv("CELERY_RESULT_BACKEND", settings.REDIS_URL)

task_modules = [
    "app.tasks.verification",
    "app.tasks.ratings",
    "app.tasks.scrapers",
    "app.tasks.pipeline",
]

celery_app = Celery(
    "proofile_worker",
    broker=broker,
    backend=backend,
    include=task_modules,
)

task_routes = {
    # Verification tasks
    "app.tasks.verification.process_document_ocr": {"queue": "documents"},
    "app.tasks.verification.send_otp_email": {"queue": "emails"},
    "app.tasks.verification.send_peer_verification_email": {"queue": "emails"},
}

beat_schedule = {
    # Recalculate trust scores daily at 3 AM
    "recalculate-trust-scores-daily": {
        "task": "recalculate_trust_score",
        "schedule": crontab(hour=3, minute=0),
        "options": {"queue": "default"},
    },
    # Cleanup expired opportunities daily at 4 AM
    "cleanup-expired-opportunities": {
        "task": "app.tasks.pipeline.cleanup_expired_opportunities",
        "schedule": crontab(hour=4, minute=0),
        "options": {"queue": "default"},
    },
}


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
    task_routes=task_routes,
    # Task settings
    task_acks_late=True,  # For reliability
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # One task at a time for slow OCR
    
    # ==================== CELERY BEAT SCHEDULE ====================
    # Scheduled tasks for automated processing
    beat_schedule=beat_schedule,
    
    # Beat scheduler settings
    beat_scheduler="celery.beat:PersistentScheduler",
    beat_schedule_filename="/tmp/celerybeat-schedule",
)


@celery_app.task
def ping():
    """Health check task."""
    return "pong"

