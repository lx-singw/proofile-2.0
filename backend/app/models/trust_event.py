"""
Trust Event Model
Immutable audit log for trust score changes and verification events
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base, TimestampMixin


class TrustEvent(Base, TimestampMixin):
    """
    Immutable log of trust-related events.
    Used for auditing, analytics, and dispute resolution.
    """
    __tablename__ = "trust_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event type: identity_verified, employment_verified, skill_verified, etc.
    event_type = Column(String(50), nullable=False, index=True)
    
    # Event data (varies by type)
    event_data = Column(JSONB, default=dict)
    
    # Actor: 'system', 'stripe_webhook', 'admin_xxx', 'user_xxx'
    actor = Column(String(100), default='system')
    
    # Relationship
    user = relationship("User", back_populates="trust_events")

    def __repr__(self):
        return f"<TrustEvent {self.event_type} for user {self.user_id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_type": self.event_type,
            "event_data": self.event_data,
            "actor": self.actor,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class VerificationAuditLog(Base):
    """
    Detailed audit log for verification status changes.
    Tracks every state change for compliance and debugging.
    """
    __tablename__ = "verification_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    verification_id = Column(Integer, ForeignKey("verifications.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Action: 'created', 'status_changed', 'approved_by_ai', 'rejected_manual', 'expired'
    action = Column(String(50), nullable=False)
    
    # Previous and new status
    old_status = Column(String(20))
    new_status = Column(String(20))
    
    # Actor and details
    actor = Column(String(100), default='system')
    details = Column(JSONB, default=dict)
    
    # Immutable timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    verification = relationship("Verification", back_populates="audit_logs")

    def __repr__(self):
        return f"<VerificationAuditLog {self.action} on verification {self.verification_id}>"
