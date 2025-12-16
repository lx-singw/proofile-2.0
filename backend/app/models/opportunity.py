from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped
from .base import Base, TimestampMixin

class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    company_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    opportunity_type = Column(String(100), nullable=True)  # full-time, part-time, contract, internship, learnership, etc.
    required_skills = Column(Text, nullable=True)  # JSON array of required skills
    experience_level = Column(String(50), nullable=True)  # entry, mid, senior, lead
    industry = Column(String(100), nullable=True)  # e.g., "Technology", "Healthcare"
    salary_range = Column(String(100), nullable=True)  # e.g., "R80k-R120k"
    
    # Opportunity category: 'jobs' or 'training_skills_programs'
    category = Column(String(50), default='jobs')  # 'jobs' or 'training_skills_programs'
    
    # Verification requirements for applicants
    requires_verification_level = Column(Integer, default=0)  # 0=none, 1=L1 (skill), 2=L2 (employment), 3=L3 (identity)
    verified_candidates_only = Column(Boolean, default=False)  # If True, only verified users can apply
    
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Relationship to User
    employer: Mapped["User"] = relationship("User", back_populates="opportunities")
    
    @property
    def is_verified_only(self) -> bool:
        """Check if this opportunity requires verified candidates"""
        return self.verified_candidates_only or self.requires_verification_level >= 2


# Backward compatibility alias
Job = Opportunity
