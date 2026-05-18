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
]
