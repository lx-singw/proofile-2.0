"""
Post Model for Feed System

Represents user-created content in the feed including:
- Text posts
- Milestone announcements
- Job shares
- Polls
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from typing import List, Optional, TYPE_CHECKING
import enum

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user import User
    from .reaction import Reaction
    from .comment import Comment


class PostType(str, enum.Enum):
    """Types of feed posts"""
    TEXT = "text"
    MILESTONE = "milestone"
    JOB_SHARE = "job_share"
    POLL = "poll"
    ACHIEVEMENT = "achievement"
    SKILL_VERIFIED = "skill_verified"
    PROFILE_UPDATE = "profile_update"


class PostVisibility(str, enum.Enum):
    """Visibility options for posts"""
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PRIVATE = "private"


class Post(Base, TimestampMixin):
    """
    Feed Post Model
    
    Stores user-generated content in the professional feed.
    """
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Post Content
    type = Column(String(50), nullable=False, default=PostType.TEXT.value)
    content = Column(Text, nullable=False)
    visibility = Column(String(20), nullable=False, default=PostVisibility.PUBLIC.value)
    
    # Metadata (JSON stored as text for flexibility)
    post_metadata = Column(Text, nullable=True)  # JSON: poll options, job details, etc.
    
    # Media attachments
    media_urls = Column(ARRAY(String), nullable=True)  # List of media URLs
    
    # Engagement counters (denormalized for performance)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    
    # Status
    is_pinned = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="posts")
    reactions: Mapped[List["Reaction"]] = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")
    comments: Mapped[List["Comment"]] = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Post(id={self.id}, type={self.type}, user_id={self.user_id})>"
    
    @property
    def total_engagement(self) -> int:
        """Calculate total engagement score"""
        return self.likes_count + (self.comments_count * 2) + (self.shares_count * 3)
