from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime
from .base import Base, TimestampMixin
import enum

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentType(str, enum.Enum):
    PAID_INBOX = "paid_inbox"
    SKILL_BOUNTY = "skill_bounty"
    SUBSCRIPTION = "subscription"

class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True) # For P2P like Paid Inbox
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="ZAR")
    
    stripe_payment_intent_id = Column(String, unique=True, index=True, nullable=True)
    stripe_session_id = Column(String, unique=True, index=True, nullable=True)
    
    status = Column(String, default=PaymentStatus.PENDING.value)
    payment_type = Column(String, nullable=False)
    
    # Fees and earnings
    platform_fee = Column(Float, default=0.0)
    recipient_earnings = Column(Float, default=0.0)
    
    # Metadata for specific actions (e.g. post_id for a bounty or prompt for a message)
    metadata_json = Column(JSON, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], backref="payments_as_sender")
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id], backref="payments_as_recipient")
