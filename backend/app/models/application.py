"""
Application Model

Tracks user job applications
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    VIEWED = "viewed"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    status = Column(String(20), default=ApplicationStatus.DRAFT)
    
    # Application content
    resume_version = Column(Text, nullable=True)  # Tailored resume content
    cover_letter = Column(Text, nullable=True)
    custom_answers = Column(JSON, nullable=True)  # Additional application questions
    
    # Match data at time of application
    match_score = Column(Integer, nullable=True)
    gap_analysis = Column(JSON, nullable=True)
    
    # Tracking
    applied_at = Column(DateTime, nullable=True)
    last_status_update = Column(DateTime, default=datetime.utcnow)
    
    # Employer response
    employer_notes = Column(Text, nullable=True)
    interview_dates = Column(JSON, nullable=True)
    offer_details = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    
    def __repr__(self):
        return f"<Application {self.id}: User {self.user_id} -> Job {self.job_id} ({self.status})>"
