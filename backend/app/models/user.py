from datetime import datetime
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

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
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
    
    # Public profile fields
    username = Column(String, unique=True, index=True, nullable=True)  # Unique username for public profile URL
    bio = Column(Text, nullable=True)  # User bio/about section
    profile_photo_url = Column(String, nullable=True)  # URL to profile photo
    profile_visibility = Column(String, nullable=False, default="public")  # public or private
    
    is_active = Column(Boolean, default=True)

    # Relationship to Profile
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Relationship to Jobs
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="employer", cascade="all, delete-orphan")
    # Relationship to Resumes
    # Use fully-qualified target to avoid import/mapper ordering issues
    resumes: Mapped[list["app.models.resume.Resume"]] = relationship("app.models.resume.Resume", back_populates="user", cascade="all, delete-orphan")
    
    # Relationship to Activities
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="user", cascade="all, delete-orphan", order_by="desc(Activity.created_at)")
    
    # Relationship to Notifications
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="desc(Notification.created_at)")
    
    # Relationship to Profile Data Sources
    data_sources: Mapped[list["app.models.profile_data_source.ProfileDataSource"]] = relationship("app.models.profile_data_source.ProfileDataSource", back_populates="user", cascade="all, delete-orphan", order_by="desc(ProfileDataSource.created_at)")



# Track latest status changes (id, updated_at, is_active) keyed by email
USER_STATUS_CACHE: Dict[str, Tuple[int, datetime, bool]] = {}


@event.listens_for(User, "after_insert")
def _user_after_insert(mapper, connection, target: User) -> None:
    try:
        if target.email:
            USER_STATUS_CACHE[target.email.lower()] = (
                target.id,
                target.updated_at or datetime.utcnow(),
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
                target.updated_at or datetime.utcnow(),
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
except Exception:
    pass
