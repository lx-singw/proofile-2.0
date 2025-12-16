"""
Stripe Client Integration
Wrapper for Stripe Identity API
"""

import os
import logging
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")


@dataclass
class VerificationSession:
    """Stripe Identity Verification Session"""
    id: str
    client_secret: str
    status: str
    url: Optional[str] = None


async def create_verification_session(
    user_id: str,
    email: str,
    return_url: Optional[str] = None
) -> VerificationSession:
    """
    Create a new Stripe Identity verification session.
    
    Args:
        user_id: Internal user ID
        email: User's email for session
        return_url: URL to redirect after verification
    
    Returns:
        VerificationSession with client_secret for frontend
    """
    if not STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY not configured")
    
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    
    try:
        session = stripe.identity.VerificationSession.create(
            type="document",
            metadata={
                "user_id": user_id,
                "email": email
            },
            options={
                "document": {
                    "allowed_types": ["driving_license", "passport", "id_card"],
                    "require_id_number": False,
                    "require_live_capture": True,
                    "require_matching_selfie": True,
                }
            },
            return_url=return_url or f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verification/identity/complete"
        )
        
        return VerificationSession(
            id=session.id,
            client_secret=session.client_secret,
            status=session.status,
            url=session.url
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating verification session: {e}")
        raise


async def get_verification_session(session_id: str) -> VerificationSession:
    """Retrieve an existing verification session"""
    if not STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY not configured")
    
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    
    try:
        session = stripe.identity.VerificationSession.retrieve(session_id)
        
        return VerificationSession(
            id=session.id,
            client_secret=session.client_secret,
            status=session.status,
            url=session.url
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error retrieving session {session_id}: {e}")
        raise


async def cancel_verification_session(session_id: str) -> bool:
    """Cancel a pending verification session"""
    if not STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY not configured")
    
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    
    try:
        stripe.identity.VerificationSession.cancel(session_id)
        return True
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error canceling session {session_id}: {e}")
        return False


def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
    """Verify a Stripe webhook signature"""
    import stripe
    
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        raise ValueError("STRIPE_WEBHOOK_SECRET not configured")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        return event
        
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise
