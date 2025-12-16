"""
Portal Opportunity Model

Represents aggregated opportunity listings for the public Portal.
These are scraped/aggregated from various sources for anonymous browsing.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, Index
from sqlalchemy.dialects.postgresql import ARRAY

from .base import Base, TimestampMixin


class PortalOpportunity(Base, TimestampMixin):
    """
    Portal Opportunity Model
    
    Public opportunity listings aggregated from various sources.
    Accessible without authentication for SEO and discovery.
    """
    __tablename__ = "portal_opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # External identifiers
    external_id = Column(String(255), nullable=True, index=True)  # ID from source platform
    source = Column(String(50), nullable=False, index=True)  # 'pnet', 'linkedin', 'indeed', 'careers24'
    source_url = Column(String(500), nullable=True)  # Original posting URL
    
    # Opportunity details
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    company_logo_url = Column(String(500), nullable=True)
    
    # Category: 'jobs' or 'training_skills_programs'
    category = Column(String(50), default='jobs', index=True)  # 'jobs' or 'training_skills_programs'
    
    # Location
    location = Column(String(255), nullable=True, index=True)
    location_type = Column(String(50), nullable=True)  # 'remote', 'onsite', 'hybrid'
    country = Column(String(100), nullable=True, default="South Africa")
    city = Column(String(100), nullable=True)
    
    # Compensation
    salary_min = Column(Numeric(12, 2), nullable=True)
    salary_max = Column(Numeric(12, 2), nullable=True)
    salary_currency = Column(String(10), default="ZAR")
    salary_period = Column(String(20), nullable=True)  # 'monthly', 'yearly', 'hourly'
    
    # Description
    description = Column(Text, nullable=True)
    description_html = Column(Text, nullable=True)  # Original HTML if available
    
    # Requirements
    skills = Column(ARRAY(String), nullable=True)
    experience_level = Column(String(50), nullable=True)  # 'entry', 'mid', 'senior', 'lead'
    education_requirement = Column(String(255), nullable=True)
    years_experience_min = Column(Integer, nullable=True)
    years_experience_max = Column(Integer, nullable=True)
    
    # Categories
    opportunity_type = Column(String(50), nullable=True)  # 'full-time', 'part-time', 'contract', 'internship', 'learnership'
    industry = Column(String(100), nullable=True, index=True)  # 'technology', 'finance', etc.
    
    # Dates
    posted_at = Column(DateTime, nullable=True, index=True)
    expires_at = Column(DateTime, nullable=True)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)  # Manually verified listing
    
    # Analytics
    views_count = Column(Integer, default=0)
    applies_count = Column(Integer, default=0)  # Clicks to apply
    saves_count = Column(Integer, default=0)
    
    # SEO
    slug = Column(String(300), nullable=True, unique=True, index=True)  # URL-friendly slug
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_portal_opportunities_search', 'title', 'company', 'location'),
        Index('ix_portal_opportunities_filter', 'category', 'location_type', 'experience_level'),
        Index('ix_portal_opportunities_active_posted', 'is_active', 'posted_at'),
    )
    
    def __repr__(self):
        return f"<PortalOpportunity(id={self.id}, title={self.title}, company={self.company})>"
    
    @property
    def salary_display(self) -> str:
        """Format salary for display"""
        if not self.salary_min and not self.salary_max:
            return "Salary not specified"
        
        currency = self.salary_currency or "ZAR"
        if self.salary_min and self.salary_max:
            return f"{currency} {int(self.salary_min):,} - {int(self.salary_max):,}"
        elif self.salary_min:
            return f"From {currency} {int(self.salary_min):,}"
        else:
            return f"Up to {currency} {int(self.salary_max):,}"
    
    @property
    def is_remote(self) -> bool:
        """Check if opportunity supports remote work"""
        return self.location_type in ['remote', 'hybrid']
    
    @property
    def is_training_program(self) -> bool:
        """Check if this is a training/skills program"""
        return self.category == 'training_skills_programs'


# Backward compatibility alias
PortalJob = PortalOpportunity
