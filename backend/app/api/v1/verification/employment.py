"""
Employment Verification API Routes
Corporate email authentication for L2 employment verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import secrets

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.verification import Verification
from app.services.email_domain_validator import (
    get_validator, validate_work_email, generate_otp
)

router = APIRouter(prefix="/employment", tags=["employment-verification"])


class InitiateEmploymentVerificationRequest(BaseModel):
    """Request to start employment verification"""
    work_email: EmailStr
    job_id: Optional[int] = None  # ID of the job entry to verify
    company_name: Optional[str] = None  # Company name for matching


class ConfirmOTPRequest(BaseModel):
    """Confirm OTP for email verification"""
    verification_id: int
    otp_code: str


class VerificationStatusResponse(BaseModel):
    """Status of employment verification"""
    verification_id: int
    status: str
    method: str
    company_name: Optional[str] = None
    domain: Optional[str] = None
    verified_at: Optional[datetime] = None


@router.post("/validate-email")
async def validate_work_email_domain(
    work_email: EmailStr,
    company_name: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Pre-validate a work email before initiating verification.
    Returns whether the domain is valid for employment verification.
    """
    validator = get_validator()
    result = validator.validate_for_employment(work_email, company_name)
    
    return {
        "email": work_email,
        "valid": result["valid"],
        "domain": result["domain"],
        "is_work_email": result["is_work_email"],
        "company_match": result["company_match"],
        "match_confidence": result["match_confidence"],
        "message": result["message"]
    }


@router.post("/initiate", response_model=VerificationStatusResponse)
async def initiate_employment_verification(
    data: InitiateEmploymentVerificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Initiate employment verification via corporate email.
    Sends OTP to the provided work email.
    """
    # Validate work email domain
    is_valid, message, domain = validate_work_email(data.work_email)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Check for existing pending verification
    result = await db.execute(
        select(Verification).where(
            Verification.user_id == current_user.id,
            Verification.verification_type == "employment",
            Verification.verified_value == data.work_email,
            Verification.status == "pending"
        )
    )
    existing = result.scalar_one_or_none()
    
    # Generate OTP
    otp = generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    if existing:
        # Update existing pending verification
        existing.token = otp
        existing.token_expires_at = expires
        existing.verification_data = str({
            "domain": domain,
            "company_name": data.company_name,
            "job_id": data.job_id
        })
        verification = existing
    else:
        # Create new verification record
        verification = Verification(
            user_id=current_user.id,
            verification_type="employment",
            status="pending",
            verified_value=data.work_email,
            verification_provider="domain_email",
            token=otp,
            token_expires_at=expires,
            verification_data=str({
                "domain": domain,
                "company_name": data.company_name,
                "job_id": data.job_id
            })
        )
        db.add(verification)
    
    await db.commit()
    await db.refresh(verification)
    
    # TODO: Send OTP email via SendGrid
    # from app.services.email_service import send_otp_email
    # await send_otp_email(data.work_email, otp)
    
    # For development, return OTP in response
    import os
    response = VerificationStatusResponse(
        verification_id=verification.id,
        status="pending",
        method="domain_email",
        company_name=data.company_name,
        domain=domain
    )
    
    if os.getenv("ENVIRONMENT") != "production":
        # Include debug info in dev
        return {
            **response.model_dump(),
            "debug_otp": otp,  # REMOVE IN PRODUCTION
            "message": f"OTP sent to {data.work_email}"
        }
    
    return response


@router.post("/confirm")
async def confirm_employment_verification(
    data: ConfirmOTPRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Confirm employment verification with OTP code.
    """
    # Find the verification
    result = await db.execute(
        select(Verification).where(
            Verification.id == data.verification_id,
            Verification.user_id == current_user.id,
            Verification.verification_type == "employment",
            Verification.status == "pending"
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found or already completed"
        )
    
    # Check expiration
    if verification.token_expires_at and verification.token_expires_at < datetime.utcnow():
        verification.status = "expired"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    # Verify OTP
    if verification.token != data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Mark as verified
    verification.status = "verified"
    verification.verified_at = datetime.utcnow()
    verification.trust_level = "L2"
    verification.trust_points = 15  # 15 points per verified job
    
    # Update user's trust score
    try:
        from app.services.trust_score_engine import update_trust_score
        await update_trust_score(current_user.id, "employment_verified", db)
    except ImportError:
        # Trust score engine not fully integrated
        pass
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Employment verified successfully",
        "verification_id": verification.id,
        "trust_points_earned": 15
    }


@router.get("/status/{verification_id}", response_model=VerificationStatusResponse)
async def get_employment_verification_status(
    verification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get status of an employment verification"""
    result = await db.execute(
        select(Verification).where(
            Verification.id == verification_id,
            Verification.user_id == current_user.id,
            Verification.verification_type == "employment"
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found"
        )
    
    # Parse verification data if exists
    company_name = None
    domain = None
    if verification.verification_data:
        try:
            import ast
            data = ast.literal_eval(verification.verification_data)
            company_name = data.get("company_name")
            domain = data.get("domain")
        except (ValueError, SyntaxError):
            pass
    
    return VerificationStatusResponse(
        verification_id=verification.id,
        status=verification.status,
        method=verification.verification_provider or "domain_email",
        company_name=company_name,
        domain=domain,
        verified_at=verification.verified_at
    )


@router.post("/resend-otp")
async def resend_employment_otp(
    verification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Resend OTP for a pending employment verification"""
    result = await db.execute(
        select(Verification).where(
            Verification.id == verification_id,
            Verification.user_id == current_user.id,
            Verification.verification_type == "employment",
            Verification.status == "pending"
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending verification not found"
        )
    
    # Generate new OTP
    otp = generate_otp()
    verification.token = otp
    verification.token_expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    await db.commit()
    
    # TODO: Resend email
    
    import os
    if os.getenv("ENVIRONMENT") != "production":
        return {
            "success": True,
            "message": "OTP resent",
            "debug_otp": otp  # REMOVE IN PRODUCTION
        }
    
    return {"success": True, "message": "OTP resent to your work email"}
