"""
Social interaction models: Follow, Connection, Endorsement, ProfileStar, Rating
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, UniqueConstraint, CheckConstraint, Float
from sqlalchemy.dialects.postgresql import UUID
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
    
    # Pillar 2: Weighted Endorsements
    weight = Column(Float, default=1.0, nullable=False)  # Influence of this endorsement
    is_verified_colleague = Column(Boolean, default=False)  # If they worked at the same place
    experience_id = Column(UUID(as_uuid=True), ForeignKey("work_experiences.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    endorser = relationship("User", foreign_keys=[endorser_id], backref="given_endorsements")
    endorsed_user = relationship("User", foreign_keys=[endorsed_user_id], backref="received_endorsements")
    
    __table_args__ = (
        UniqueConstraint('endorser_id', 'endorsed_user_id', 'skill', name='unique_skill_endorsement'),
        CheckConstraint('endorser_id != endorsed_user_id', name='no_self_endorsement'),
    )


class Rating(Base, TimestampMixin):
    """Professional rating from one user to another with anti-gaming measures."""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rated_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rater_name = Column(String(255), nullable=True)  # Name of rater (null if anonymous)
    score = Column(Integer, nullable=False)  # 1-5 rating
    category = Column(String(50), nullable=False)  # professionalism, communication, skills, reliability
    review = Column(Text, nullable=True)  # Optional review text
    is_anonymous = Column(Boolean, default=False)  # Allow anonymous ratings
    
    # Anti-Gaming: Relationship verification
    company = Column(String(255), nullable=True)  # Company where they worked together
    work_start_date = Column(DateTime, nullable=True)  # When working relationship started
    work_end_date = Column(DateTime, nullable=True)  # When working relationship ended
    relationship_type = Column(String(50), nullable=True)  # colleague, manager, direct_report, client
    
    # Anti-Gaming: Suspicious pattern detection
    is_flagged = Column(Boolean, nullable=False, default=False, index=True)
    flag_reason = Column(Text, nullable=True)
    is_reviewed = Column(Boolean, nullable=False, default=False)
    review_notes = Column(Text, nullable=True)  # Admin review notes
    
    # Relationships
    rater = relationship("User", foreign_keys=[rater_id], backref="given_ratings")
    rated_user = relationship("User", foreign_keys=[rated_user_id], backref="received_ratings")
    
    __table_args__ = (
        CheckConstraint('rater_id != rated_user_id', name='no_self_rating'),
        CheckConstraint('score >= 1 AND score <= 5', name='valid_score_range'),
    )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'rater_id': self.rater_id,
            'rated_user_id': self.rated_user_id,
            'rater_name': self.rater_name,
            'score': self.score,
            'category': self.category,
            'review': self.review,
            'company': self.company,
            'is_anonymous': self.is_anonymous,
            'is_flagged': self.is_flagged,
            'flag_reason': self.flag_reason,
            'is_reviewed': self.is_reviewed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }



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
