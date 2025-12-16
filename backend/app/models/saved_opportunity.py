from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime
from .base import Base

class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False, index=True)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)  # Optional notes about why saved

    # Ensure a user can't save the same opportunity twice
    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", name="unique_user_opportunity"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    opportunity: Mapped["Opportunity"] = relationship("Opportunity")


# Backward compatibility alias
SavedJob = SavedOpportunity
