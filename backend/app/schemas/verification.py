"""
Verification schemas for API requests/responses.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class VerificationCreate(BaseModel):
    verification_type: str = Field(..., description="Type: email, phone, identity, education, employment, skills")
    verification_data: Optional[str] = Field(None, description="JSON string with type-specific data")


class VerificationUpdate(BaseModel):
    verification_data: Optional[str] = None
    document_url: Optional[str] = None


class VerificationResponse(BaseModel):
    id: int
    user_id: int
    verification_type: str
    status: str
    verification_data: Optional[str]
    document_url: Optional[str]
    verified_value: Optional[str]
    verification_provider: Optional[str]
    verified_at: Optional[datetime]
    expires_at: Optional[datetime]
    failure_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VerificationSummary(BaseModel):
    """Summary of user's verification status."""
    email_verified: bool
    phone_verified: bool
    identity_verified: bool
    education_verified: bool
    employment_verified: bool
    skills_verified: bool
    verification_score: int  # 0-100 based on verifications
    verifications: List[VerificationResponse]


class InitiateEmailVerification(BaseModel):
    email: str = Field(..., description="Email to verify")


class ConfirmEmailVerification(BaseModel):
    token: str = Field(..., description="Verification token from email")


class InitiatePhoneVerification(BaseModel):
    phone: str = Field(..., description="Phone number to verify")


class ConfirmPhoneVerification(BaseModel):
    code: str = Field(..., description="Verification code from SMS")
