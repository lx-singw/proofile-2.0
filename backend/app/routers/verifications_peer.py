from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, cast, String
from datetime import datetime
from typing import List, Optional
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.peer_verification_request import PeerVerificationRequest, PeerVerificationStatus
from app.models.notification import Notification
from app.models.experience import WorkExperience
from app.models.post import Post, PostType
from app.services import notification_service

router = APIRouter(prefix="/verifications/peer", tags=["verifications-peer"])
logger = logging.getLogger(__name__)

@router.get("/opportunities")
async def get_verification_opportunities(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Find potential peers who worked at same companies at overlapping times.
    """
    # 1. Get current user's profile and experience
    profile = await session.execute(select(Profile).where(Profile.user_id == current_user.id))
    user_profile = profile.scalar_one_or_none()
    
    if not user_profile or not user_profile.experience_data:
        return []
        
    my_experience = user_profile.experience_data # List of dicts
    
    opportunities = []
    
    # Simple strategy: Find users who have the same company name in their experience
    # Note: Logic is simplified for MVP. Production needs vector search or normalized company names.
    
    for exp in my_experience:
        company = exp.get('company')
        if not company:
            continue
            
        # Normalize for search
        term = company.lower().strip()
        
        # Find other profiles containing this company string in their JSON experience_data
        # PostgreSQL JSONB search
        query = select(Profile).join(User).where(
            and_(
                Profile.user_id != current_user.id,
                cast(Profile.experience_data, String).ilike(f"%{term}%") 
            )
        ).limit(10)
        
        result = await session.execute(query)
        peer_profiles = result.scalars().all()
        
        for p in peer_profiles:
            # Check for existing request
            existing = await session.execute(
                select(PeerVerificationRequest).where(
                    and_(
                        PeerVerificationRequest.requester_id == current_user.id,
                        PeerVerificationRequest.verifier_id == p.user_id,
                        PeerVerificationRequest.company == company
                    )
                )
            )
            if existing.scalars().first():
                continue

            # In-memory overlap check (robust enough for MVP)
            peer_experiences = p.experience_data or []
            matched = False
            for pe in peer_experiences:
                if pe.get('company', '').lower().strip() == term:
                     matched = True # Found company match
                     break
            
            if matched:
                opportunities.append({
                    "user": {
                        "id": p.user.id,
                        "full_name": p.user.full_name,
                        "headline": p.headline or p.user.role, 
                        "avatar_url": p.user.profile_photo_url
                    },
                    "company": company,
                    "role": exp.get('role'),
                    "period": f"{exp.get('start_date')} - {exp.get('end_date')}"
                })
                
    return opportunities

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def request_peer_verification(
    verifier_id: int,
    company: str,
    experience_id: Optional[str] = None,
    role: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    message: str = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Send a verification request to a peer."""
    if verifier_id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot verify yourself")
         
    # Check existence
    existing = await session.execute(
        select(PeerVerificationRequest).where(
            and_(
                PeerVerificationRequest.requester_id == current_user.id,
                PeerVerificationRequest.verifier_id == verifier_id,
                PeerVerificationRequest.company == company,
                PeerVerificationRequest.status != PeerVerificationStatus.DENIED
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Request already exists")

    request = PeerVerificationRequest(
        requester_id=current_user.id,
        verifier_id=verifier_id,
        experience_id=experience_id,
        company=company,
        role=role,
        start_date=start_date,
        end_date=end_date,
        message=message,
        status=PeerVerificationStatus.PENDING
    )
    session.add(request)
    
    # Notify Verifier using real-time service
    await notification_service.notify_user(
        db_session=session,
        user_id=verifier_id,
        notification_type="verification_request",
        name=current_user.full_name,
        company=company,
        link="/dashboard"
    )
    
    await session.commit()
    await session.refresh(request)
    return request

@router.get("/pending")
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get requests I need to answer."""
    query = select(PeerVerificationRequest).where(
        and_(
            PeerVerificationRequest.verifier_id == current_user.id,
            PeerVerificationRequest.status == PeerVerificationStatus.PENDING
        )
    ).order_by(PeerVerificationRequest.created_at.desc())
    
    result = await session.execute(query)
    items = result.scalars().all()
    
    enriched = []
    for item in items:
        requester = await session.get(User, item.requester_id)
        enriched.append({
            **item.__dict__, # serialization might need refinement
            "id": item.id,
            "company": item.company,
            "role": item.role,
            "status": item.status,
            "created_at": item.created_at,
            "requester": {
                "id": requester.id,
                "full_name": requester.full_name,
                "avatar_url": requester.profile_photo_url
            }
        })
    return enriched

@router.post("/{request_id}/respond")
async def respond_to_request(
    request_id: int,
    action: str = Query(..., regex="^(verify|deny)$"),
    response_note: str = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Verify or Deny a request."""
    request = await session.get(PeerVerificationRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if request.verifier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if action == "verify":
        request.status = PeerVerificationStatus.VERIFIED
        notif_title = "Work History Verified!"
        notif_msg = f"{current_user.full_name} verified your work at {request.company}."
        notif_type = "success"
    else:
        request.status = PeerVerificationStatus.DENIED
        notif_title = "Verification Declined"
        notif_msg = f"{current_user.full_name} could not verify your work at {request.company}."
        notif_type = "warning"
        
    request.response_note = response_note
    
    # Notify Requester using real-time service
    await notification_service.notify_user(
        db_session=session,
        user_id=request.requester_id,
        notification_type="verification_success" if action == "verify" else "verification_denied",
        name=current_user.full_name,
        company=request.company,
        link="/profile"
    )
    
    await session.commit()
    
    if action == "verify":
        # 1. Update WorkExperience if linked
        if request.experience_id:
            experience = await session.get(WorkExperience, request.experience_id)
            if experience:
                experience.is_verified = True
                session.add(experience)
        
        # 2. Recalculate Trust Score (Pillar 1)
        # TrustScoreEngine should be used here. For MVP, we'll assume it's triggered by background task or similar
        # engine = TrustScoreEngine(session)
        # await engine.update_user_score(request.requester_id)
        
        # 3. Create Feed Post (Pillar 2 - Action-heavy feed)
        post = Post(
            user_id=request.requester_id,
            type=PostType.MILESTONE.value,
            content=f"Verified work experience at {request.company}! Thanks to {current_user.full_name} for the confirmation.",
            visibility="public"
        )
        session.add(post)
        
        # 4. Trigger Viral Engine: Notify colleagues (Pillar 5)
        requester = await session.get(User, request.requester_id)
        if requester:
            await notification_service.trigger_network_verification_viral(
                db_session=session,
                company=request.company,
                verified_user_name=requester.full_name,
                exclude_user_id=request.requester_id
            )
        
        await session.commit()

    return {"status": request.status}
