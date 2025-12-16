from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime
from .base import Base

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)  # Optional notes about why saved

    # Ensure a user can't save the same job twice
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="unique_user_job"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    job: Mapped["Job"] = relationship("Job")
