"""
Resume Model
"""

import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Resume(Base, TimestampMixin):
    """A resume document owned by a user."""

    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    data = Column(JSONB, nullable=False, default=dict)
    template_id = Column(String(50), nullable=False, server_default="modern")
    file_path = Column(String(512), nullable=True)
    status = Column(String(50), nullable=False, server_default="draft")
    analysis_results = Column(JSONB, nullable=True)
    ats_score = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Resume id={self.id} name={self.name!r} user_id={self.user_id}>"


class ResumeVersion(Base):
    """Version history for a resume."""

    __tablename__ = "resume_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    description = Column(String, nullable=True)

    # Relationships
    resume = relationship("Resume", back_populates="versions")

    def __repr__(self) -> str:
        return f"<ResumeVersion id={self.id} resume_id={self.resume_id} v={self.version_number}>"
