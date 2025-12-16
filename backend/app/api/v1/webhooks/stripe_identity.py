"""
Stripe Identity Webhook Handler
Processes async verification status updates from Stripe
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe
import hmac
import hashlib
import os
from datetime import datetime

from app.core.database import get_db
from app.models.verification import Verification

router = APIRouter(prefix="/stripe", tags=["webhooks"])

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


def verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> dict:
    """Verify Stripe webhook signature"""
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, secret)
        return event
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")


@router.post("/identity")
async def handle_stripe_identity_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Stripe Identity webhook events:
    - identity.verification_session.verified
    - identity.verification_session.requires_input
    - identity.verification_session.canceled
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    
    # Verify signature in production
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = verify_stripe_signature(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except HTTPException:
            raise
    else:
        # Development mode - parse without verification
        import json
        event = json.loads(payload)
    
    event_type = event.get("type")
    data = event.get("data", {}).get("object", {})
    session_id = data.get("id")
    
    if not session_id:
        return {"received": True, "processed": False, "reason": "No session ID"}
    
    # Find the verification record
    verification = db.query(Verification).filter(
        Verification.provider_id == session_id,
        Verification.method == "stripe"
    ).first()
    
    if not verification:
        return {"received": True, "processed": False, "reason": "Verification not found"}
    
    if event_type == "identity.verification_session.verified":
        # User successfully verified
        verification.status = "verified"
        verification.verified_at = datetime.utcnow()
        
        # Extract verified data from Stripe response
        verified_outputs = data.get("verified_outputs", {})
        
        verification.metadata.update({
            "document_type": verified_outputs.get("id_number_type"),
            "country": verified_outputs.get("address", {}).get("country"),
            "first_name": verified_outputs.get("first_name"),
            "last_name": verified_outputs.get("last_name"),
            "dob": verified_outputs.get("dob"),
            "verified_at": datetime.utcnow().isoformat()
        })
        
        # Update trust score
        try:
            from app.services.trust_score_engine import update_trust_score
            update_trust_score(verification.user_id, "identity_verified", db)
        except ImportError:
            pass
        
        # Log the event
        try:
            from app.models.trust_event import TrustEvent
            event_log = TrustEvent(
                user_id=verification.user_id,
                event_type="identity_verified",
                event_data={
                    "verification_id": str(verification.id),
                    "provider": "stripe",
                    "session_id": session_id
                }
            )
            db.add(event_log)
        except ImportError:
            pass
    
    elif event_type == "identity.verification_session.requires_input":
        # Verification needs additional input
        verification.status = "pending"
        last_error = data.get("last_error", {})
        verification.metadata["requires_input"] = True
        verification.metadata["error_code"] = last_error.get("code")
        verification.metadata["error_reason"] = last_error.get("reason")
    
    elif event_type == "identity.verification_session.canceled":
        # User canceled verification
        verification.status = "rejected"
        verification.metadata["canceled"] = True
        verification.metadata["canceled_at"] = datetime.utcnow().isoformat()
    
    db.commit()
    
    return {
        "received": True,
        "processed": True,
        "event_type": event_type,
        "verification_id": str(verification.id)
    }


@router.post("/test")
async def test_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Test endpoint for webhook development"""
    payload = await request.body()
    return {
        "received": True,
        "payload_size": len(payload),
        "headers": dict(request.headers)
    }
