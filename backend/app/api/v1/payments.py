from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.payment_service import PaymentService
from pydantic import BaseModel

router = APIRouter(prefix="/payments", tags=["payments"])

class OnboardingRequest(BaseModel):
    return_url: str
    refresh_url: str

class PaidInboxRequest(BaseModel):
    recipient_id: int
    amount: float = 20.0 # Default fee in ZAR
    success_url: str
    cancel_url: str
    message: str

@router.post("/onboard")
async def onboard_user(
    request: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a Stripe Connect onboarding link for the current user.
    """
    service = PaymentService(db)
    url = await service.create_onboarding_link(
        user=current_user,
        return_url=request.return_url,
        refresh_url=request.refresh_url
    )
    return {"url": url}

@router.get("/onboarding-status")
async def get_onboarding_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if the current user has completed Stripe onboarding.
    """
    service = PaymentService(db)
    is_onboarded = await service.check_onboarding_status(current_user)
    return {"is_onboarded": is_onboarded}

@router.post("/paid-inbox/initiate")
async def initiate_paid_inbox(
    request: PaidInboxRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initiate a Stripe Checkout session for a Paid Inbox message.
    """
    service = PaymentService(db)
    recipient = db.query(User).filter(User.id == request.recipient_id).first()
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
        
    try:
        url = await service.initiate_paid_inbox_session(
            sender=current_user,
            recipient=recipient,
            amount=request.amount,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            message_metadata={"message": request.message}
        )
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to initiate payment")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhooks.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    service = PaymentService(db)
    try:
        await service.handle_webhook_event(payload, sig_header)
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
