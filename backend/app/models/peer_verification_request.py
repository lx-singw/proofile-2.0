from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime, timezone
from app.models.base import Base

class PeerVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DENIED = "denied"
    IGNORED = "ignored"

class PeerVerificationRequest(Base):
    __tablename__ = "peer_verification_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    verifier_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Linked experience (optional)
    experience_id = Column(UUID(as_uuid=True), ForeignKey("work_experiences.id", ondelete="SET NULL"), nullable=True)
    
    # Context of verification
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    status = Column(String(50), default=PeerVerificationStatus.PENDING.value, nullable=False)
    message = Column(Text, nullable=True)  # Optional message from requester
    response_note = Column(Text, nullable=True) # Optional note from verifier
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="sent_peer_verifications")
    verifier = relationship("User", foreign_keys=[verifier_id], backref="received_peer_verifications")
