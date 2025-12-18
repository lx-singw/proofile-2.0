from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
import enum

from .base import Base

class ProfileState(str, enum.Enum):
    GHOST = "ghost"           # Anonymous user, resume tools only
    EMBRYO = "embryo"         # Just signed up, minimal data
    GROWING = "growing"       # Profile building (30-70%)
    MATURE = "mature"         # Complete profile (70-90%)
    VERIFIED = "verified"     # High verification level (90%+)
    CHAMPION = "champion"     # Verified + active + highly rated

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    headline = Column(String(255))
    summary = Column(Text)
    avatar_url = Column(String(255), nullable=True)
    
    # New fields for Living Profile
    state = Column(String, default=ProfileState.EMBRYO.value) 
    completeness_score = Column(Float, default=0.0)
    completeness_data = Column(JSON, default={}) # Stores detailed score breakdown
    
    # Store consolidated sections that don't have their own tables yet
    # In a full implementation, these might be relationships, but using JSON for flexible aggregation initially
    skills_data = Column(JSON, default=[]) 
    experience_data = Column(JSON, default=[])
    education_data = Column(JSON, default=[])

    # Bidirectional relationship with User
    user = relationship("User", back_populates="profile")

    @property
    def experiences(self):
        return self.user.work_experiences

    @property
    def portfolio(self):
        return self.user.portfolio_items