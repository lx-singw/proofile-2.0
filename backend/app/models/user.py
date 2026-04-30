from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, event, Text
from sqlalchemy.orm import relationship, Mapped
from typing import Dict, Tuple
from .base import Base, TimestampMixin
import enum


class UserRole(str, enum.Enum):
    APPRENTICE = "apprentice"
    EMPLOYER = "employer"
    ADMIN = "admin"


class UserPersona(str, enum.Enum):
    STUDENT = "student"
    GRADUATE = "graduate"
    APPRENTICE = "apprentice"
    PROFESSIONAL = "professional"
    JOB_SEEKER = "job_seeker"
    CAREER_CHANGER = "career_changer"
    REMOTE_WORKER = "remote_worker"
    FREELANCER = "freelancer"
    RECRUITER = "recruiter"


class OpportunityPreference(str, enum.Enum):
    """User's primary opportunity category preference."""
    JOBS = "jobs"  # Employment, contracts, freelance, consulting
    TRAINING_SKILLS_PROGRAMS = "training_skills_programs"  # Internships, learnerships, apprenticeships
    BOTH = "both"  # Interested in all opportunities


class UserStatus(str, enum.Enum):
    OPEN_TO_WORK = "open_to_work"
    HIRING = "hiring"
    LEARNING = "learning"
    EXPLORING = "exploring"


class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    # Professional status badge (Dimension 6 Extension)
    status = Column(String, nullable=True) # open_to_work, hiring, learning, exploring, or None
    # Role stored as plain string in the DB. Application-level enum `UserRole`
    # is kept for validation/logic, but the DB column is a `String` so Alembic
    # and runtime SQLAlchemy won't attempt to create/alter Postgres enum types.
    role = Column(String, nullable=False, default=UserRole.APPRENTICE.value)
    # Persona stored as string, nullable initially to allow existing users
    persona = Column(String, nullable=True)
    # Onboarding fields for personalization
    experience_level = Column(String, nullable=True)
    primary_goal = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    dashboard_preferences = Column(Text, nullable=True, default="{}")  # JSON string for dashboard settings
    skills = Column(Text, nullable=True)  # JSON array of skills as text
    
    # Opportunity Category Preference (set during onboarding)
    # Values: 'jobs', 'training_skills_programs', 'both'
    opportunity_preference = Column(String, nullable=True, default=None)
    
    # =========================================================================
    # PERSONALIZATION DIMENSIONS (11 Dimensions Framework)
    # =========================================================================
    
    # Dimension 4: Experience Level (extended)
    years_experience = Column(Integer, nullable=True)
    
    # Dimension 5: Location/Province (SA-Specific)
    province = Column(String, nullable=True)  # gauteng, western_cape, etc.
    city = Column(String, nullable=True)
    willing_to_relocate = Column(Boolean, default=False)
    
    # Dimension 6: Career Intent
    # Values: actively_looking, passively_open, career_changer, upskilling, returning_to_work, exploring_options
    career_intent = Column(String, nullable=True)
    available_from = Column(String, nullable=True)  # Date as string for flexibility
    notice_period_weeks = Column(Integer, nullable=True)
    
    # Dimension 9: Salary Expectations (ZAR)
    salary_expectation_min = Column(Integer, nullable=True)
    salary_expectation_max = Column(Integer, nullable=True)
    salary_negotiable = Column(Boolean, default=True)
    
    # Dimension 10: Work Mode Preference
    # Values: remote_only, hybrid, office_based, field_work, flexible
    work_mode_preference = Column(String, nullable=True)
    max_commute_minutes = Column(Integer, nullable=True)
    
    # Trust Score (Dimension 7 - already exists)
    trust_score = Column(Integer, default=0) # Global trust score (0-100)
    
    # Public profile fields
    username = Column(String, unique=True, index=True, nullable=True)  # Unique username for public profile URL
    bio = Column(Text, nullable=True)  # User bio/about section
    profile_photo_url = Column(String, nullable=True)  # URL to profile photo
    profile_visibility = Column(String, nullable=False, default="public")  # public or private
    
    is_active = Column(Boolean, default=True)
    
    # Stripe Integration Fields
    stripe_account_id = Column(String, unique=True, index=True, nullable=True) # For Connect (P2P Sellers)
    stripe_customer_id = Column(String, unique=True, index=True, nullable=True) # For Payers
    is_stripe_onboarded = Column(Boolean, default=False)

    # Relationship to Profile
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Relationship to Opportunities (renamed from Jobs)
    opportunities: Mapped[list["Opportunity"]] = relationship("Opportunity", back_populates="employer", cascade="all, delete-orphan")
    # Note: 'jobs' alias removed due to SQLAlchemy conflict - use 'opportunities' directly
    # Relationship to Resumes
    # Use fully-qualified target to avoid import/mapper ordering issues
    resumes: Mapped[list["app.models.resume.Resume"]] = relationship("app.models.resume.Resume", back_populates="user", cascade="all, delete-orphan")
    
    # Relationship to Activities
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="user", cascade="all, delete-orphan", order_by="desc(Activity.created_at)")
    
    # Relationship to Notifications
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="desc(Notification.created_at)")
    
    # Relationship to Profile Data Sources
    data_sources: Mapped[list["app.models.profile_data_source.ProfileDataSource"]] = relationship("app.models.profile_data_source.ProfileDataSource", back_populates="user", cascade="all, delete-orphan", order_by="desc(ProfileDataSource.created_at)")
    
    # Trust System Relationships
    trust_events: Mapped[list["app.models.trust_event.TrustEvent"]] = relationship("app.models.trust_event.TrustEvent", back_populates="user", cascade="all, delete-orphan", order_by="desc(TrustEvent.created_at)")
    documents: Mapped[list["app.models.document.Document"]] = relationship("app.models.document.Document", back_populates="user", cascade="all, delete-orphan")
    skill_attempts: Mapped[list["app.models.document.SkillAttempt"]] = relationship("app.models.document.SkillAttempt", back_populates="user", cascade="all, delete-orphan")
    
    # Feed System Relationships
    posts: Mapped[list["app.models.post.Post"]] = relationship("app.models.post.Post", back_populates="user", cascade="all, delete-orphan", order_by="desc(Post.created_at)")
    reactions: Mapped[list["app.models.reaction.Reaction"]] = relationship("app.models.reaction.Reaction", back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list["app.models.comment.Comment"]] = relationship("app.models.comment.Comment", back_populates="user", cascade="all, delete-orphan")

    # Experience & Portfolio
    work_experiences: Mapped[list["app.models.experience.WorkExperience"]] = relationship("app.models.experience.WorkExperience", back_populates="user", cascade="all, delete-orphan", order_by="desc(app.models.experience.WorkExperience.start_date)")
    portfolio_items: Mapped[list["app.models.portfolio.PortfolioItem"]] = relationship("app.models.portfolio.PortfolioItem", back_populates="user", cascade="all, delete-orphan")



# WARNING: This is a process-local dict. With multiple Uvicorn workers, each
# worker has its own cache, leading to potentially stale data. For single-worker
# deployments this is fine. For multi-worker, consider using Redis instead.
USER_STATUS_CACHE: Dict[str, Tuple[int, datetime, bool]] = {}


@event.listens_for(User, "after_insert")
def _user_after_insert(mapper, connection, target: User) -> None:
    try:
        if target.email:
            USER_STATUS_CACHE[target.email.lower()] = (
                target.id,
                target.updated_at or datetime.now(timezone.utc),
                target.is_active,
            )
    except (AttributeError, TypeError) as e:
        # Log but don't fail the transaction if cache update fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to update user status cache on insert: {e}")


@event.listens_for(User, "after_update")
def _user_after_update(mapper, connection, target: User) -> None:
    try:
        if target.email:
            USER_STATUS_CACHE[target.email.lower()] = (
                target.id,
                target.updated_at or datetime.now(timezone.utc),
                target.is_active,
            )
    except (AttributeError, TypeError) as e:
        # Log but don't fail the transaction if cache update fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to update user status cache on update: {e}")


# Ensure related models are imported so SQLAlchemy can locate them when
# configuring mappers in different import orders (prevents mapper lookup errors).
try:
    import app.models.resume  # noqa: F401
    import app.models.profile_data_source  # noqa: F401
    import app.models.trust_event  # noqa: F401
    import app.models.document  # noqa: F401
    import app.models.experience  # noqa: F401
    import app.models.portfolio  # noqa: F401
except Exception:
    pass

