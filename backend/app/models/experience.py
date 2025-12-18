from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
import uuid
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, TimestampMixin

class WorkExperience(Base, TimestampMixin):
    __tablename__ = "work_experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    is_current = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="work_experiences")

    def to_dict(self):
        return {
            "id": str(self.id),
            "company": self.company,
            "title": self.title,
            "location": self.location,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "description": self.description,
            "is_current": self.is_current,
            "is_verified": self.is_verified
        }
