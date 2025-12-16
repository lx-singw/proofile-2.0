"""
Reaction Model for Feed System

Represents user reactions to posts (like, celebrate, support, etc.)
Similar to LinkedIn's reaction system.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from typing import TYPE_CHECKING
import enum

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user import User
    from .post import Post


class ReactionType(str, enum.Enum):
    """Types of reactions users can make"""
    LIKE = "like"
    CELEBRATE = "celebrate"
    SUPPORT = "support"
    INSIGHTFUL = "insightful"
    CURIOUS = "curious"


class Reaction(Base, TimestampMixin):
    """
    Post Reaction Model
    
    Tracks user reactions to feed posts.
    Each user can have only one reaction per post.
    """
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Reaction type
    type = Column(String(20), nullable=False, default=ReactionType.LIKE.value)
    
    # Relationships
    post: Mapped["Post"] = relationship("Post", back_populates="reactions")
    user: Mapped["User"] = relationship("User", back_populates="reactions")
    
    # Ensure one reaction per user per post
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_reaction_post_user'),
    )
    
    def __repr__(self):
        return f"<Reaction(id={self.id}, type={self.type}, post_id={self.post_id}, user_id={self.user_id})>"
