"""
Verification models for user verification status.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Verification(Base, TimestampMixin):
    """Track verification status for different verification types."""
    __tablename__ = "verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_type = Column(String(50), nullable=False)  # email, phone, identity, education, employment, skills
    status = Column(String(20), nullable=False, default="not_started")  # not_started, pending, verified, failed, expired
    
    # Verification details
    verification_data = Column(Text, nullable=True)  # JSON string for type-specific data
    document_url = Column(String(500), nullable=True)  # URL to uploaded verification document
    verified_value = Column(String(255), nullable=True)  # The verified value
    
    # Verification metadata
    verification_provider = Column(String(100), nullable=True)  # manual, trulioo, etc.
    verification_reference = Column(String(255), nullable=True)  # External reference ID
    verified_at = Column(DateTime, nullable=True)  # When verification was completed
    expires_at = Column(DateTime, nullable=True)  # When verification expires
    failure_reason = Column(Text, nullable=True)  # Reason for failed verification
    
    # Request/Token fields (for email/peer verification flows)
    token = Column(String, index=True, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="verifications")
