from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime, Date, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from .base import Base, TimestampMixin


class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(500), nullable=True, unique=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    company_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    opportunity_type = Column("job_type", String(100), nullable=True)  # full-time, part-time, contract, internship, learnership, etc.
    required_skills = Column(Text, nullable=True)  # JSON array of required skills (kept for backward compat)
    experience_level = Column(String(50), nullable=True)  # entry, mid, senior, lead
    industry = Column(String(100), nullable=True)  # e.g., "Technology", "Healthcare"
    salary_range = Column(String(100), nullable=True)  # legacy string form e.g. "R80k-R120k"

    # Feed-specific fields (added for the opportunity feed)
    source = Column(String(50), nullable=True, index=True)  # linkedin | indeed | pnet | careers24 | offerzen | direct
    source_id = Column(String(255), nullable=True)  # original listing ID for deduplication
    source_url = Column(Text, nullable=True, unique=True)
    source_platform = Column(String(50), nullable=True, index=True)
    remote_type = Column(String(20), nullable=True)  # onsite | hybrid | remote | flexible
    salary_min = Column(Integer, nullable=True)  # ZAR monthly
    salary_max = Column(Integer, nullable=True)  # ZAR monthly
    salary_visible = Column(Boolean, default=True)
    quality_score = Column(Float, default=0.5)  # 0–1, updated by ingestion pipeline
    trust_score = Column(Float, nullable=True)
    engagement_rate = Column(Float, default=0.0)  # updated continuously from feed signals
    ai_status = Column(String(20), nullable=True, index=True)
    ai_confidence_score = Column(Float, nullable=True)
    posted_at = Column(DateTime, nullable=True)  # original posting date from source
    expires_at = Column(DateTime, nullable=True)
    application_deadline_date = Column(Date, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    application_url = Column(Text, nullable=True)
    is_direct = Column(Boolean, default=False)  # employer posted directly vs aggregated
    is_active = Column(Boolean, default=True)  # feed eligibility (quality scored + not expired)
    is_duplicate_of = Column(Integer, ForeignKey("opportunities.id"), nullable=True)  # merged duplicate tracking

    # Structured location fields (extracted from raw location string)
    city = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)

    # Opportunity category: 'jobs' or 'training_skills_programs'
    category = Column(String(50), default='jobs')

    # Verification requirements for applicants
    requires_verification_level = Column(Integer, default=0)  # 0=none, 1=L1 (skill), 2=L2 (employment), 3=L3 (identity)
    verified_candidates_only = Column(Boolean, default=False)

    # Rich AI-extracted fields (sprint5_001) — stored as JSON strings
    benefits = Column(Text, nullable=True)                       # JSON: ["Medical Aid", "Pension"]
    required_documents = Column(Text, nullable=True)             # JSON: ["CV", "Certified ID Copy"]
    tags = Column(Text, nullable=True)                           # JSON: ["bursary", "banking", "Gauteng"]
    red_flags = Column(Text, nullable=True)                      # JSON: ["Gmail contact email"]
    qualification_requirements = Column(Text, nullable=True)     # JSON: {minimum: {...}, ideal: {...}}
    experience_requirements = Column(Text, nullable=True)        # JSON: {minimum: {...}, ideal: {...}}
    skills_structured = Column(Text, nullable=True)              # JSON: [{name, level}]
    knowledge_requirements = Column(Text, nullable=True)         # JSON: {minimum: [...], ideal: [...]}
    conditions_of_employment = Column(Text, nullable=True)       # JSON: ["Clear criminal record"]
    duration = Column(String(100), nullable=True)                # "12 months", "Permanent"
    start_date = Column(Date, nullable=True)
    scam_score = Column(Float, nullable=True, default=0.0)       # 0.0–1.0 fraud probability
    contact_website = Column(String(500), nullable=True)         # Company career page URL

    employer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # nullable for aggregated listings

    # Relationship to User
    employer: Mapped["User"] = relationship("User", back_populates="opportunities")

    @property
    def is_verified_only(self) -> bool:
        return self.verified_candidates_only or self.requires_verification_level >= 2


class FeedSignal(Base):
    """Tracks every meaningful interaction a user or anonymous session has with a feed card."""
    __tablename__ = "feed_signals"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # null for anonymous
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=True, index=True)  # null for non-opportunity cards
    card_type = Column(String(50), nullable=False)  # opportunity | insight | graph | market | community
    signal_type = Column(String(50), nullable=False)  # view | dwell_3s | dwell_10s | expand | interest | dismiss | save | share | scroll_past
    feed_position = Column(Integer, nullable=True)  # card's position in the feed
    session_duration_ms = Column(Integer, nullable=True)  # ms user has been on feed at time of signal
    timestamp = Column(DateTime, nullable=False)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    opportunity: Mapped["Opportunity"] = relationship("Opportunity", foreign_keys=[opportunity_id])


class UserFeedState(Base, TimestampMixin):
    """Persists per-user feed personalisation state."""
    __tablename__ = "user_feed_state"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    last_seen_cursor = Column(String(255), nullable=True)
    dismissed_ids = Column(Text, nullable=True)   # JSON array of opportunity IDs
    saved_ids = Column(Text, nullable=True)        # JSON array of opportunity IDs
    inferred_roles = Column(Text, nullable=True)   # JSON array of inferred role strings
    inferred_salary_min = Column(Integer, nullable=True)
    inferred_salary_max = Column(Integer, nullable=True)
    inferred_location = Column(String(255), nullable=True)
    feed_version = Column(Integer, default=1)      # incremented when signal model updates

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


# Backward compatibility alias
Job = Opportunity


class OpportunityActivity(Base, TimestampMixin):
    """
    First-class record of a user's engagement action on a specific opportunity.
    Replaces the raw FeedSignal for interest/save actions so aggregates are
    fast (indexed) and per-user state is directly queryable.
    """
    __tablename__ = "opportunity_activity"
    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", "activity_type", name="uq_opp_activity_user_opp_type"),
    )

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    # 'interested' | 'saved' | 'applied' | 'shared'
    activity_type = Column(String(30), nullable=False, index=True)
    # True when the row represents an active state (False = toggled off)
    is_active = Column(Boolean, default=True, nullable=False)

    opportunity: Mapped["Opportunity"] = relationship("Opportunity", foreign_keys=[opportunity_id])
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
