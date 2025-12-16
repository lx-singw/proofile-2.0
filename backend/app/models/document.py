"""
Document Model
Metadata structure for verification documents (actual files stored in S3)
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base, TimestampMixin


class Document(Base, TimestampMixin):
    """
    Document metadata for verification.
    SECURITY: Actual file contents are stored in S3 and deleted after processing.
    This table only stores metadata and processing results.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_id = Column(Integer, ForeignKey("verifications.id", ondelete="SET NULL"), nullable=True)
    
    # Document metadata
    document_type = Column(String(50), nullable=False)  # paystub, offer_letter, transcript, etc.
    filename = Column(String(255))
    content_type = Column(String(100))  # image/jpeg, application/pdf, etc.
    file_size = Column(Integer)  # bytes
    
    # Security
    content_hash = Column(String(64))  # SHA-256 hash for duplicate detection
    encrypted = Column(Boolean, default=True)
    
    # Processing status
    status = Column(String(20), default='pending')  # pending, processing, complete, failed, deleted
    
    # Extracted data (anonymized/aggregate only)
    extracted_data = Column(JSONB, default=dict)
    match_score = Column(Integer)  # 0-100 match percentage
    
    # Timestamps
    processed_at = Column(DateTime)
    deleted_at = Column(DateTime)  # When file was deleted from S3
    
    # Additional data
    extra_data = Column(JSONB, default=dict)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    verification = relationship("Verification", back_populates="documents")

    def __repr__(self):
        return f"<Document {self.document_type} for user {self.user_id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "document_type": self.document_type,
            "status": self.status,
            "match_score": self.match_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }
    
    def mark_deleted(self):
        """Mark the document as deleted from storage"""
        self.status = "deleted"
        self.deleted_at = datetime.utcnow()


class SkillAttempt(Base, TimestampMixin):
    """
    Record of skill assessment attempts.
    Stores scores and basic stats, answers stored securely if needed.
    """
    __tablename__ = "skill_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Skill identification
    skill_slug = Column(String(100), nullable=False, index=True)
    skill_name = Column(String(255))
    
    # Results
    score = Column(Integer)  # 0-100
    passed = Column(Boolean, default=False)
    correct_answers = Column(Integer)
    total_questions = Column(Integer)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    time_taken_seconds = Column(Integer)
    
    # Answers (encrypted if stored)
    answers = Column(JSONB)  # Optional: store answers for analytics
    
    # Relationship
    user = relationship("User", back_populates="skill_attempts")

    def __repr__(self):
        return f"<SkillAttempt {self.skill_slug} by user {self.user_id}: {self.score}%>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "skill_slug": self.skill_slug,
            "skill_name": self.skill_name,
            "score": self.score,
            "passed": self.passed,
            "taken_at": self.started_at.isoformat() if self.started_at else None,
        }
