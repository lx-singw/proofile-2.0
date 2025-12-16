"""
Identity Verification API Routes (L3)
Handles Stripe Identity integration for government ID verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.verification import Verification

router = APIRouter(prefix="/identity", tags=["identity-verification"])


class InitiateResponse(BaseModel):
    """Response when initiating identity verification"""
    session_id: str
    client_secret: str
    url: Optional[str] = None


class VerificationStatusResponse(BaseModel):
    """Status of identity verification"""
    session_id: str
    status: str  # requires_input, processing, verified, canceled
    verified_at: Optional[datetime] = None
    document_type: Optional[str] = None
    country: Optional[str] = None


@router.post("/init", response_model=InitiateResponse)
async def initiate_identity_verification(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new Stripe Identity verification session.
    Returns client_secret for frontend to open the verification modal.
    """
    # Check if user already has verified identity
    existing = db.query(Verification).filter(
        Verification.user_id == current_user.id,
        Verification.verification_type == "identity",
        Verification.status == "verified"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identity already verified"
        )
    
    # Check for pending verification
    pending = db.query(Verification).filter(
        Verification.user_id == current_user.id,
        Verification.verification_type == "identity",
        Verification.status == "pending"
    ).first()
    
    if pending and pending.provider_id:
        # Return existing session if still valid
        # In production, check with Stripe if session is still active
        return InitiateResponse(
            session_id=pending.provider_id,
            client_secret=pending.metadata.get("client_secret", ""),
            url=pending.metadata.get("url")
        )
    
    try:
        # Import Stripe integration
        from app.services.integrations.stripe_client import create_verification_session
        
        # Create verification session with Stripe
        session = await create_verification_session(
            user_id=str(current_user.id),
            email=current_user.email
        )
        
        # Create or update verification record
        verification = Verification(
            user_id=current_user.id,
            verification_type="identity",
            verification_provider="stripe",
            status="pending",
            verification_reference=session.id,
            verification_data=str({
                "client_secret": session.client_secret,
                "url": session.url
            })
        )
        db.add(verification)
        db.commit()
        
        return InitiateResponse(
            session_id=session.id,
            client_secret=session.client_secret,
            url=session.url
        )
        
    except ImportError:
        # Mock response for development without Stripe
        mock_session_id = f"vi_mock_{current_user.id}_{datetime.utcnow().timestamp()}"
        mock_secret = f"vs_mock_secret_{mock_session_id}"
        
        verification = Verification(
            user_id=current_user.id,
            verification_type="identity",
            verification_provider="stripe",
            status="pending",
            verification_reference=mock_session_id,
            verification_data=str({"client_secret": mock_secret, "mock": True})
        )
        db.add(verification)
        db.commit()
        
        return InitiateResponse(
            session_id=mock_session_id,
            client_secret=mock_secret
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create verification session: {str(e)}"
        )


@router.get("/status/{session_id}", response_model=VerificationStatusResponse)
async def get_verification_status(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the status of an identity verification session"""
    verification = db.query(Verification).filter(
        Verification.provider_id == session_id,
        Verification.user_id == current_user.id
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification session not found"
        )
    
    return VerificationStatusResponse(
        session_id=session_id,
        status=verification.status,
        verified_at=verification.verified_at,
        document_type=verification.metadata.get("document_type"),
        country=verification.metadata.get("country")
    )


@router.post("/complete/{session_id}")
async def complete_verification(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark verification as complete (for development/testing).
    In production, this is handled by Stripe webhook.
    """
    if os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manual completion not allowed in production"
        )
    
    verification = db.query(Verification).filter(
        Verification.provider_id == session_id,
        Verification.user_id == current_user.id
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification session not found"
        )
    
    verification.status = "verified"
    verification.verified_at = datetime.utcnow()
    verification.metadata["document_type"] = "passport"
    verification.metadata["country"] = "US"
    
    # Update user trust score
    from app.services.trust_score_engine import update_trust_score
    await update_trust_score(current_user.id, "identity_verified", db)
    
    db.commit()
    
    return {"success": True, "message": "Identity verified successfully"}
