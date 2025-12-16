"""
Verification API: Email, phone, identity, education, employment verification
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from datetime import timedelta # Added
import secrets
import json

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.verification import Verification
from app.services.profile_builder import UniversalProfileBuilder, DataSourceType # added
from app.schemas.verification import (
    VerificationCreate, VerificationUpdate, VerificationResponse,
    VerificationSummary, InitiateEmailVerification, ConfirmEmailVerification,
    InitiatePhoneVerification, ConfirmPhoneVerification
)

router = APIRouter()

# VERIFICATION_TOKENS removed



@router.get("/", response_model=List[VerificationResponse])
async def get_verifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all verifications for the current user."""
    result = await db.execute(
        select(Verification).where(Verification.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/summary", response_model=VerificationSummary)
async def get_verification_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get verification summary for the current user, including Trust Score."""
    from app.services.trust_score_engine import calculate_trust_score, get_trust_level
    
    result = await db.execute(
        select(Verification).where(Verification.user_id == current_user.id)
    )
    verifications = result.scalars().all()
    
    # Build verification status map
    status_map = {v.verification_type: v.status for v in verifications}
    
    # Calculate trust score using the engine
    # Note: trust_score_engine uses sync Session, but we're in async context.
    # For now, we manually replicate the logic here. TODO: Refactor to async.
    score = 0
    
    # Identity: +30
    if status_map.get("identity") == "verified":
        score += 30
    elif status_map.get("email") == "verified" and status_map.get("phone") == "verified":
        score += 10
    
    # Jobs: +15 each (max 40)
    job_count = sum(1 for v in verifications if v.verification_type == "employment" and v.status == "verified")
    score += min(job_count * 15, 40)
    
    # Skills: +5 each (max 20)
    skill_count = sum(1 for v in verifications if v.verification_type == "skills" and v.status == "verified")
    score += min(skill_count * 5, 20)
    
    score = min(100, score)
    
    return VerificationSummary(
        email_verified=status_map.get("email") == "verified",
        phone_verified=status_map.get("phone") == "verified",
        identity_verified=status_map.get("identity") == "verified",
        education_verified=status_map.get("education") == "verified",
        employment_verified=status_map.get("employment") == "verified",
        skills_verified=status_map.get("skills") == "verified",
        verification_score=score,
        verifications=[VerificationResponse.model_validate(v) for v in verifications]
    )


@router.post("/email/initiate", response_model=dict)
async def initiate_email_verification(
    data: InitiateEmailVerification,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initiate email verification process."""
    from datetime import timedelta
    
    # Check if already verified
    result = await db.execute(
        select(Verification).where(
            Verification.user_id == current_user.id,
            Verification.verification_type == "email"
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing and existing.status == "verified":
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate verification token
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    
    # Create or update verification record
    if existing:
        existing.status = "pending"
        existing.verified_value = data.email
        existing.token = token
        existing.token_expires_at = expires
    else:
        verification = Verification(
            user_id=current_user.id,
            verification_type="email",
            status="pending",
            verified_value=data.email,
            token=token,
            token_expires_at=expires
        )
        db.add(verification)
    
    await db.commit()
    
    # In production, send email here
    # For development, return the token
    return {
        "message": "Verification email sent",
        "debug_token": token  # Remove in production
    }


@router.post("/email/confirm", response_model=VerificationResponse)
async def confirm_email_verification(
    data: ConfirmEmailVerification,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm email verification with token."""
    from app.services.profile_builder import UniversalProfileBuilder, DataSourceType
    
    # Check token in DB
    result = await db.execute(
        select(Verification).where(
            Verification.user_id == current_user.id,
            Verification.token == data.token,
            Verification.verification_type == "email"
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if not verification.token_expires_at or verification.token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Verify!
    verification.status = "verified"
    verification.verified_at = datetime.utcnow()
    verification.verification_provider = "internal"
    verification.token = None # Clear token
    verification.token_expires_at = None
    
    await db.commit()
    await db.refresh(verification)
    
    # Update Profile Score (Trust Points)
    builder = UniversalProfileBuilder(db)
    await builder.ingest_data(
        user_id=current_user.id,
        source=DataSourceType.VERIFICATION,
        data={"verified_type": "email", "verified_value": verification.verified_value},
        confidence=1.0
    )
    
    return verification


@router.post("/phone/initiate", response_model=dict)
async def initiate_phone_verification(
    data: InitiatePhoneVerification,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initiate phone verification process."""
    from datetime import timedelta
    
    # Check if already verified
    result = await db.execute(
        select(Verification).where(
            Verification.user_id == current_user.id,
            Verification.verification_type == "phone"
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing and existing.status == "verified":
        raise HTTPException(status_code=400, detail="Phone already verified")
    
    # Generate verification code
    code = f"{secrets.randbelow(10000):04d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    
    # Create or update verification record
    if existing:
        existing.status = "pending"
        existing.verified_value = data.phone
        existing.token = code
        existing.token_expires_at = expires
    else:
        verification = Verification(
            user_id=current_user.id,
            verification_type="phone",
            status="pending",
            verified_value=data.phone,
            token=code,
            token_expires_at=expires
        )
        db.add(verification)
    
    await db.commit()
    
    # In production, send SMS here
    return {
        "message": "Verification code sent",
        "debug_code": code  # Remove in production
    }


@router.post("/phone/confirm", response_model=VerificationResponse)
async def confirm_phone_verification(
    data: ConfirmPhoneVerification,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm phone verification with code."""
    from app.services.profile_builder import UniversalProfileBuilder, DataSourceType
    
    # Check code in DB
    result = await db.execute(
        select(Verification).where(
            Verification.user_id == current_user.id,
            Verification.token == data.code,
            Verification.verification_type == "phone"
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid code")
    
    if not verification.token_expires_at or verification.token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code expired")
    
    # Verify
    verification.status = "verified"
    verification.verified_at = datetime.utcnow()
    verification.verification_provider = "internal"
    verification.token = None
    verification.token_expires_at = None
    
    await db.commit()
    await db.refresh(verification)
    
    # Update Profile
    builder = UniversalProfileBuilder(db)
    await builder.ingest_data(
        user_id=current_user.id,
        source=DataSourceType.VERIFICATION,
        data={"verified_type": "phone", "verified_value": verification.verified_value},
        confidence=1.0
    )
    
    return verification


@router.post("/", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
async def create_verification(
    data: VerificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new verification request (for education, employment, skills)."""
    valid_types = ["education", "employment", "skills", "identity"]
    if data.verification_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid verification type. Use: {valid_types}"
        )
    
    # Check for existing
    result = await db.execute(
        select(Verification).where(
            Verification.user_id == current_user.id,
            Verification.verification_type == data.verification_type
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing
        existing.status = "pending"
        existing.verification_data = data.verification_data
        await db.commit()
        await db.refresh(existing)
        return existing
    
    # Create new
    verification = Verification(
        user_id=current_user.id,
        verification_type=data.verification_type,
        status="pending",
        verification_data=data.verification_data
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)
    
    return verification


@router.patch("/{verification_id}", response_model=VerificationResponse)
async def update_verification(
    verification_id: int,
    data: VerificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a verification request (e.g., add document URL)."""
    verification = await db.get(Verification, verification_id)
    
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    if verification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if data.verification_data is not None:
        verification.verification_data = data.verification_data
    if data.document_url is not None:
        verification.document_url = data.document_url
    
    await db.commit()
    await db.refresh(verification)
    
    return verification


@router.delete("/{verification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_verification(
    verification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a verification request."""
    verification = await db.get(Verification, verification_id)
    
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    if verification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(verification)
    await db.commit()
