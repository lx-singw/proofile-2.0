"""
VerifiedReview Model — The core Proofile trust signal.

A verified review is:
- Tied to a specific work experience entry
- Authored by a named, public reviewer (no anonymity)
- Feeds the Proofile Score formula
- Created via a token-based email invitation flow

Flow:
1. Profile owner requests a review for a work experience entry
2. System generates a unique token and sends an email to the reviewer
3. Reviewer clicks the link, fills the form (no account required)
4. Review is published on the profile under that work entry
5. Proofile Score is recalculated
"""
from datetime import datetime, timedelta
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, DateTime,
    Boolean, Float, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
import secrets
import enum

from .base import Base, TimestampMixin


class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    PUBLISHED = "published"
    RETRACTED = "retracted"
    EXPIRED = "expired"
    DISPUTED = "disputed"


class RelationshipType(str, enum.Enum):
    MANAGED_ME = "managed_me"
    COLLEAGUE = "colleague"
    CLIENT = "client"
    MENTORED_ME = "mentored_me"
    I_MANAGED = "i_managed"


# Reviewer seniority points (from PRD Section 3.3)
SENIORITY_SCORES = {
    "c_suite": 10,
    "founder": 10,
    "director": 8,
    "vp": 8,
    "manager": 6,
    "senior": 6,
    "peer": 4,
    "colleague": 4,
    "client": 7,
    "junior": 3,
}


class VerifiedReview(Base, TimestampMixin):
    """
    A verified professional review tied to a specific work experience.

    This is the core unit of the Proofile trust graph. Each review creates
    an edge: Reviewer → [relationship, weight] → Reviewee.
    """
    __tablename__ = "verified_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String(64), unique=True, nullable=False, index=True)

    # Who is being reviewed, and for which work entry
    reviewee_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    work_experience_id = Column(
        UUID(as_uuid=True), ForeignKey("work_experiences.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # Reviewer identity — always public, never anonymous
    reviewer_email = Column(String(255), nullable=False)
    reviewer_name = Column(String(255), nullable=True)  # Filled on submission
    reviewer_title = Column(String(255), nullable=True)
    reviewer_company = Column(String(255), nullable=True)
    reviewer_proofile_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationship context
    relationship_type = Column(String(50), nullable=False)

    # Review content — filled on submission
    star_rating = Column(Integer, nullable=True)
    written_review = Column(Text, nullable=True)
    endorsed_skills = Column(JSON, default=list)

    # Computed on submission
    reviewer_seniority_score = Column(Float, default=4.0)

    # Status tracking
    status = Column(String(20), nullable=False, default=ReviewStatus.PENDING.value)
    expires_at = Column(DateTime, nullable=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)

    # Integrity
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(Text, nullable=True)
    is_disputed = Column(Boolean, default=False)

    # Relationships
    reviewee = relationship(
        "User", foreign_keys=[reviewee_id],
        backref="received_verified_reviews"
    )
    reviewer_profile = relationship(
        "User", foreign_keys=[reviewer_proofile_id],
        backref="given_verified_reviews"
    )
    work_experience = relationship(
        "WorkExperience",
        backref="verified_reviews"
    )

    __table_args__ = (
        CheckConstraint(
            'star_rating IS NULL OR (star_rating >= 1 AND star_rating <= 5)',
            name='valid_review_star_range'
        ),
    )

    @staticmethod
    def generate_token() -> str:
        """Generate a secure URL-safe token for review submission links."""
        return secrets.token_urlsafe(32)

    @staticmethod
    def default_expiration() -> datetime:
        """Default 30-day expiration for review requests."""
        return datetime.utcnow() + timedelta(days=30)

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    @property
    def is_pending(self) -> bool:
        return self.status == ReviewStatus.PENDING.value and not self.is_expired

    @property
    def is_completed(self) -> bool:
        return self.status == ReviewStatus.PUBLISHED.value

    def compute_seniority_score(self, title: str = "") -> float:
        """Compute reviewer seniority score from their title."""
        if not title:
            return SENIORITY_SCORES.get("peer", 4.0)
        title_lower = title.lower()
        for key, score in SENIORITY_SCORES.items():
            if key.replace("_", " ") in title_lower or key in title_lower:
                return float(score)
        # Check common patterns
        if any(t in title_lower for t in ["ceo", "cto", "cfo", "coo", "chief"]):
            return 10.0
        if any(t in title_lower for t in ["director", "head of"]):
            return 8.0
        if any(t in title_lower for t in ["manager", "lead", "senior"]):
            return 6.0
        if any(t in title_lower for t in ["intern", "junior", "graduate"]):
            return 3.0
        return 4.0  # Default: peer level

    def to_public_dict(self) -> dict:
        """Return public-safe representation for profile display."""
        return {
            "id": str(self.id),
            "reviewer_name": self.reviewer_name,
            "reviewer_title": self.reviewer_title,
            "reviewer_company": self.reviewer_company,
            "relationship_type": self.relationship_type,
            "star_rating": self.star_rating,
            "written_review": self.written_review,
            "endorsed_skills": self.endorsed_skills or [],
            "reviewer_has_proofile": self.reviewer_proofile_id is not None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
