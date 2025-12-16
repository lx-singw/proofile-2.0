"""
Rating Request Model - Invitation-based rating system

Features:
- Multi-channel sharing (email, WhatsApp, SMS, in-app, link)
- 30-day token expiration
- Rater provides verifiable contact info
- Contact visibility controls
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
import secrets

from .base import Base, TimestampMixin


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    EXPIRED = "expired"
    DECLINED = "declined"


class ShareChannel(str, enum.Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    LINK = "link"
    IN_APP = "in_app"


class RatingRequest(Base, TimestampMixin):
    """
    Invitation to rate someone professionally.
    
    Flow:
    1. User creates request with relationship details
    2. Shares via email/WhatsApp/SMS/link
    3. Recipient opens link with token
    4. Recipient provides contact info + rating
    5. Rating appears on profile
    """
    __tablename__ = "rating_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who wants the rating
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Invitation details
    token = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")
    share_channel = Column(String(20), nullable=True)  # How it was shared
    
    # Invitee info (before they rate)
    invitee_email = Column(String(255), nullable=True)  # Email if known
    invitee_phone = Column(String(50), nullable=True)   # Phone if known
    invitee_name = Column(String(255), nullable=True)   # Name if known
    invitee_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationship context (filled by requester)
    relationship_type = Column(String(50), nullable=False)  # colleague, manager, client, etc
    company = Column(String(255), nullable=False)
    role_at_company = Column(String(255), nullable=True)  # Their role
    work_period_start = Column(DateTime, nullable=True)
    work_period_end = Column(DateTime, nullable=True)
    personal_message = Column(Text, nullable=True)  # Optional message to rater
    
    # Rater's verified contact info (filled when rating)
    rater_verified_email = Column(String(255), nullable=True)
    rater_verified_phone = Column(String(50), nullable=True)
    rater_company_email = Column(String(255), nullable=True)  # Work email for verification
    rater_linkedin_url = Column(String(500), nullable=True)
    
    # Contact visibility settings
    contact_visible_to_requester = Column(Boolean, default=True)
    contact_visible_to_public = Column(Boolean, default=False)
    
    # Completion tracking
    rating_id = Column(Integer, ForeignKey("ratings.id", ondelete="SET NULL"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Expiration (30 days default)
    expires_at = Column(DateTime, nullable=False)
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="sent_rating_requests")
    invitee = relationship("User", foreign_keys=[invitee_user_id], backref="received_rating_requests")
    rating = relationship("Rating", backref="rating_request")
    
    @staticmethod
    def generate_token() -> str:
        """Generate secure random token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def default_expiration() -> datetime:
        """Default 30-day expiration"""
        return datetime.utcnow() + timedelta(days=30)
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_pending(self) -> bool:
        return self.status == "pending" and not self.is_expired
    
    def get_share_url(self, base_url: str = "https://proofile.com") -> str:
        """Get the shareable rating link"""
        return f"{base_url}/rate/{self.token}"
    
    def get_whatsapp_url(self, base_url: str = "https://proofile.com") -> str:
        """Get WhatsApp share link"""
        message = f"Hi! I'd appreciate if you could rate our professional experience together at {self.company}. {self.get_share_url(base_url)}"
        return f"https://wa.me/?text={message.replace(' ', '%20')}"
    
    def get_sms_url(self, base_url: str = "https://proofile.com") -> str:
        """Get SMS share link"""
        message = f"Rate our work together: {self.get_share_url(base_url)}"
        return f"sms:?body={message.replace(' ', '%20')}"
    
    def to_dict(self, include_rater_contact: bool = False) -> dict:
        """Convert to dictionary for API responses"""
        data = {
            "id": self.id,
            "token": self.token,
            "status": self.status,
            "share_channel": self.share_channel,
            "invitee_name": self.invitee_name,
            "invitee_email": self.invitee_email,
            "relationship_type": self.relationship_type,
            "company": self.company,
            "role_at_company": self.role_at_company,
            "personal_message": self.personal_message,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "is_expired": self.is_expired,
            "is_pending": self.is_pending,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_rater_contact and self.contact_visible_to_requester:
            data["rater_verified_email"] = self.rater_verified_email
            data["rater_verified_phone"] = self.rater_verified_phone
            data["rater_company_email"] = self.rater_company_email
            data["rater_linkedin_url"] = self.rater_linkedin_url
        
        return data
