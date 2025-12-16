from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import Base

class DataSourceType(str, enum.Enum):
    RESUME_UPLOAD = "resume_upload"
    RESUME_BUILDER = "resume_builder"
    ONBOARDING = "onboarding"
    SOCIAL_ACTION = "social_action"
    VERIFICATION = "verification"
    AI_ENHANCEMENT = "ai_enhancement"
    MANUAL_ENTRY = "manual_entry"

class ProfileDataSource(Base):
    __tablename__ = "profile_data_sources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    source = Column(String, nullable=False)  # We use String to avoid PG Enum issues, validated by app logic
    data = Column(JSON, nullable=False, default={})
    confidence = Column(Float, default=1.0)  # 0.0 to 1.0
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with User
    user = relationship("User", back_populates="data_sources")
