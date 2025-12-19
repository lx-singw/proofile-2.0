from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, Float, Boolean, Table, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base, TimestampMixin

class Guild(Base, TimestampMixin):
    """
    Exclusive professional communities (Guilds) with trust-based entry requirements.
    """
    __tablename__ = "guilds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon_url = Column(String(255), nullable=True)
    banner_url = Column(String(255), nullable=True)
    
    # Gating Rules
    min_trust_score = Column(Integer, default=0)
    required_skills = Column(JSON, nullable=True) # List of skills [\"React\", \"Architecture\"]
    is_private = Column(Boolean, default=False)
    
    # Stats
    member_count = Column(Integer, default=0)
    activity_score = Column(Float, default=0.0)
    
    # Relationships
    memberships = relationship("GuildMembership", back_populates="guild", cascade="all, delete-orphan")

class GuildMembership(Base, TimestampMixin):
    """
    Association between Users and Guilds with role levels.
    """
    __tablename__ = "guild_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False)
    
    role = Column(String(50), default="member") # founder, moderator, member
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="guild_memberships")
    guild = relationship("Guild", back_populates="memberships")
