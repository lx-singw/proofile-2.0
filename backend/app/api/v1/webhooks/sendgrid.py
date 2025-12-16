"""
SendGrid Webhook Handler
Handles email delivery status and bounce notifications
"""

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.models.verification import Verification

router = APIRouter(prefix="/sendgrid", tags=["webhooks"])


@router.post("/events")
async def handle_sendgrid_events(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle SendGrid webhook events:
    - delivered: Email was delivered
    - bounce: Email bounced
    - dropped: Email was dropped
    - click: User clicked a link
    """
    try:
        events = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    if not isinstance(events, list):
        events = [events]
    
    processed = 0
    
    for event in events:
        event_type = event.get("event")
        email = event.get("email")
        sg_message_id = event.get("sg_message_id")
        
        # Extract custom args (we embed verification_id in emails)
        custom_args = event.get("unique_args", {})
        verification_id = custom_args.get("verification_id")
        
        if not verification_id:
            continue
        
        verification = db.query(Verification).filter(
            Verification.id == verification_id
        ).first()
        
        if not verification:
            continue
        
        if event_type == "delivered":
            # Email was delivered successfully
            if "email_events" not in verification.metadata:
                verification.metadata["email_events"] = []
            verification.metadata["email_events"].append({
                "type": "delivered",
                "email": email,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        elif event_type == "bounce":
            # Email bounced - mark peer verification as failed
            bounce_type = event.get("type", "unknown")
            
            if verification.method == "peer":
                # Remove this email from pending
                peer_emails = verification.metadata.get("peer_emails", [])
                if email in peer_emails:
                    peer_emails.remove(email)
                    verification.metadata["peer_emails"] = peer_emails
                    verification.metadata["bounced_emails"] = verification.metadata.get("bounced_emails", []) + [email]
                
                # If no more pending, mark as failed
                if not peer_emails:
                    verification.status = "rejected"
                    verification.metadata["rejection_reason"] = "All peer emails bounced"
        
        elif event_type == "click":
            # User clicked a link in the email
            url = event.get("url", "")
            if "verify" in url or "endorse" in url:
                if "email_events" not in verification.metadata:
                    verification.metadata["email_events"] = []
                verification.metadata["email_events"].append({
                    "type": "clicked",
                    "email": email,
                    "url": url,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        elif event_type == "dropped":
            # Email was dropped (spam, etc.)
            if "email_events" not in verification.metadata:
                verification.metadata["email_events"] = []
            verification.metadata["email_events"].append({
                "type": "dropped",
                "email": email,
                "reason": event.get("reason", "unknown"),
                "timestamp": datetime.utcnow().isoformat()
            })
        
        processed += 1
    
    db.commit()
    
    return {
        "received": True,
        "events_count": len(events),
        "processed_count": processed
    }


@router.post("/inbound")
async def handle_inbound_email(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle inbound emails (for email-based verification responses).
    Note: SendGrid Inbound Parse sends multipart form data.
    """
    form = await request.form()
    
    from_email = form.get("from", "")
    to_email = form.get("to", "")
    subject = form.get("subject", "")
    text = form.get("text", "")
    
    # Extract verification token from 'to' address
    # e.g., verify+TOKEN@proofile.com
    if "verify+" in to_email:
        token = to_email.split("verify+")[1].split("@")[0]
        
        # Find the verification by token
        verification = db.query(Verification).filter(
            Verification.metadata.op("->")("email_token").astext == token
        ).first()
        
        if verification:
            # Process the response (simplified)
            if "confirm" in text.lower() or "yes" in text.lower():
                endorsements = verification.metadata.get("endorsements_received", 0) + 1
                verification.metadata["endorsements_received"] = endorsements
                
                required = verification.metadata.get("endorsements_required", 2)
                if endorsements >= required:
                    verification.status = "verified"
                    verification.verified_at = datetime.utcnow()
                
                db.commit()
                return {"processed": True, "action": "endorsement_received"}
    
    return {"processed": False, "reason": "Could not parse email"}
