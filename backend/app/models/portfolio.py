from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, TimestampMixin

class PortfolioItem(Base, TimestampMixin):
    __tablename__ = "portfolio_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    media_url = Column(String(512), nullable=True)
    external_url = Column(String(512), nullable=True)
    
    # Optional link to experience
    experience_id = Column(UUID(as_uuid=True), ForeignKey("work_experiences.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="portfolio_items")
    experience = relationship("WorkExperience", backref="portfolio_items")

    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "media_url": self.media_url,
            "external_url": self.external_url,
            "experience_id": str(self.experience_id) if self.experience_id else None
        }
