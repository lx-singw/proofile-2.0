"""
Social interaction models: Follow, Connection, Endorsement, ProfileStar, Rating
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Follow(Base, TimestampMixin):
    """User follows another user to see their updates."""
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], backref="following")
    following = relationship("User", foreign_keys=[following_id], backref="followers")
    
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
        CheckConstraint('follower_id != following_id', name='no_self_follow'),
    )


class Connection(Base, TimestampMixin):
    """Professional connection between two users (like LinkedIn)."""
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    addressee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, accepted, rejected
    message = Column(Text, nullable=True)  # Optional connection message
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="sent_connections")
    addressee = relationship("User", foreign_keys=[addressee_id], backref="received_connections")
    
    __table_args__ = (
        UniqueConstraint('requester_id', 'addressee_id', name='unique_connection_request'),
        CheckConstraint('requester_id != addressee_id', name='no_self_connection'),
    )


class ProfileStar(Base, TimestampMixin):
    """User stars/bookmarks another profile."""
    __tablename__ = "profile_stars"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    starred_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="starred_profiles")
    starred_user = relationship("User", foreign_keys=[starred_user_id], backref="starred_by")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'starred_user_id', name='unique_profile_star'),
        CheckConstraint('user_id != starred_user_id', name='no_self_star'),
    )


class Endorsement(Base, TimestampMixin):
    """Skill endorsement from one user to another."""
    __tablename__ = "endorsements"
    
    id = Column(Integer, primary_key=True, index=True)
    endorser_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endorsed_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill = Column(String(100), nullable=False)  # The skill being endorsed
    comment = Column(Text, nullable=True)  # Optional endorsement comment
    
    # Relationships
    endorser = relationship("User", foreign_keys=[endorser_id], backref="given_endorsements")
    endorsed_user = relationship("User", foreign_keys=[endorsed_user_id], backref="received_endorsements")
    
    __table_args__ = (
        UniqueConstraint('endorser_id', 'endorsed_user_id', 'skill', name='unique_skill_endorsement'),
        CheckConstraint('endorser_id != endorsed_user_id', name='no_self_endorsement'),
    )


class Rating(Base, TimestampMixin):
    """Professional rating from one user to another."""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rated_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False)  # 1-5 rating
    category = Column(String(50), nullable=False)  # professionalism, communication, skills, reliability
    review = Column(Text, nullable=True)  # Optional review text
    is_anonymous = Column(Boolean, default=False)  # Allow anonymous ratings
    
    # Relationships
    rater = relationship("User", foreign_keys=[rater_id], backref="given_ratings")
    rated_user = relationship("User", foreign_keys=[rated_user_id], backref="received_ratings")
    
    __table_args__ = (
        UniqueConstraint('rater_id', 'rated_user_id', 'category', name='unique_category_rating'),
        CheckConstraint('rater_id != rated_user_id', name='no_self_rating'),
        CheckConstraint('score >= 1 AND score <= 5', name='valid_score_range'),
    )


class ProfileWatch(Base, TimestampMixin):
    """Watch a profile to get notifications about their updates."""
    __tablename__ = "profile_watches"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    watched_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="watched_profiles")
    watched_user = relationship("User", foreign_keys=[watched_user_id], backref="watched_by")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'watched_user_id', name='unique_profile_watch'),
        CheckConstraint('user_id != watched_user_id', name='no_self_watch'),
    )
