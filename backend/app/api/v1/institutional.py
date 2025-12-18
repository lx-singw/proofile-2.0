from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.institutional_service import InstitutionalService
from pydantic import BaseModel

router = APIRouter(prefix="/institutional", tags=["institutional"])

class InstitutionalClaimRequest(BaseModel):
    user_id: int
    verification_type: str
    verified_value: str
    metadata: Dict[str, Any] = {}

@router.post("/verify-claim")
async def verify_institutional_claim(
    request: InstitutionalClaimRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for a trusted institution (or admin acting on behalf) 
    to verify a user's claim and issue a Gold Badge.
    """
    # In production, this would check if current_user has 'institutional_partner' role
    if current_user.role != "admin": # Simple check for now
        raise HTTPException(status_code=403, detail="Only institutional partners can verify claims")
        
    service = InstitutionalService(db)
    verification = await service.issue_gold_badge(
        user_id=request.user_id,
        verification_type=request.verification_type,
        institution_name=current_user.full_name or "Institutional Partner",
        verified_value=request.verified_value,
        metadata=request.metadata
    )
    
    return {
        "status": "success",
        "verification_id": verification.id,
        "badge": "GOLD_STANDARD"
    }

@router.post("/hris-sync")
async def sync_hris_data(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initiate a synchronization with a simulated HRIS source (e.g. Workday).
    For the MVP, this immediately issues gold badges based on mock sync.
    """
    service = InstitutionalService(db)
    
    # We use background tasks for a real sync, but here we await for confirmation
    verifications = await service.simulate_hris_sync(current_user.id)
    
    return {
        "status": "sync_complete",
        "badges_issued": len(verifications),
        "sources_synced": ["Workday"],
        "details": [
            {"type": v.verification_type, "ref": v.verification_reference} 
            for v in verifications
        ]
    }
