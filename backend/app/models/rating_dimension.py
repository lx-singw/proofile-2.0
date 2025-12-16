"""
Rating Dimension Model - Taxonomy of rating attributes

Defines standard dimensions for rating different role types:
- Engineering IC
- Product Management
- Sales & GTM
- Leadership

Based on ratings_plan.md Appendix E.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, JSON
from app.models.base import Base


class RatingDimension(Base):
    """
    Definition of a rating dimension/attribute.
    
    Examples:
    - communication: "How well did they communicate?"
    - reliability: "Did they deliver on commitments?"
    - technical_depth: "Depth of technical knowledge"
    """
    __tablename__ = "rating_dimensions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Dimension identity
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Categorization
    category = Column(String(50), nullable=False)  # technical, soft_skills, execution, leadership
    
    # Role applicability
    # ["engineering", "product", "sales", "leadership", "all"]
    applicable_roles = Column(JSON, default=list)
    
    # Display settings
    icon = Column(String(50), nullable=True)  # lucide icon name
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Question format for rating wizard
    question_format = Column(String(20), default="slider")  # slider, stars, scale
    question_text = Column(Text, nullable=True)  # "How would you rate their..."
    
    # Anchors for slider
    low_anchor = Column(String(100), nullable=True)   # e.g., "Needs improvement"
    high_anchor = Column(String(100), nullable=True)  # e.g., "Outstanding"


# Default dimensions data
DEFAULT_DIMENSIONS = [
    # Technical (Engineering)
    {
        "slug": "code_quality",
        "name": "Code Quality",
        "description": "Readability, test coverage, maintainability of code",
        "category": "technical",
        "applicable_roles": ["engineering"],
        "icon": "code",
        "question_text": "How would you rate the quality of their code?",
        "low_anchor": "Needs improvement",
        "high_anchor": "Exceptional"
    },
    {
        "slug": "system_design",
        "name": "System Design",
        "description": "Architecture, scalability, trade-off analysis",
        "category": "technical",
        "applicable_roles": ["engineering"],
        "icon": "boxes",
        "question_text": "How well do they design systems?",
        "low_anchor": "Basic",
        "high_anchor": "World-class"
    },
    {
        "slug": "debugging",
        "name": "Debugging",
        "description": "Speed to resolution, root cause analysis",
        "category": "technical",
        "applicable_roles": ["engineering"],
        "icon": "bug",
        "question_text": "How effective are they at debugging issues?",
        "low_anchor": "Slow",
        "high_anchor": "Lightning fast"
    },
    
    # Soft Skills (All roles)
    {
        "slug": "communication",
        "name": "Communication",
        "description": "Clear, concise, proactive communication",
        "category": "soft_skills",
        "applicable_roles": ["all"],
        "icon": "message-circle",
        "question_text": "How would you rate their communication skills?",
        "low_anchor": "Unclear",
        "high_anchor": "Crystal clear"
    },
    {
        "slug": "collaboration",
        "name": "Collaboration",
        "description": "Works well with others, team player",
        "category": "soft_skills",
        "applicable_roles": ["all"],
        "icon": "users",
        "question_text": "How well do they collaborate with others?",
        "low_anchor": "Lone wolf",
        "high_anchor": "True team player"
    },
    {
        "slug": "mentorship",
        "name": "Mentorship",
        "description": "Willingness to help and grow others",
        "category": "soft_skills",
        "applicable_roles": ["all"],
        "icon": "graduation-cap",
        "question_text": "How actively do they mentor others?",
        "low_anchor": "Rarely helps",
        "high_anchor": "Dedicated mentor"
    },
    
    # Execution (All roles)
    {
        "slug": "reliability",
        "name": "Reliability",
        "description": "Delivers on commitments consistently",
        "category": "execution",
        "applicable_roles": ["all"],
        "icon": "check-circle",
        "question_text": "How reliable are they in delivering work?",
        "low_anchor": "Inconsistent",
        "high_anchor": "Rock solid"
    },
    {
        "slug": "ownership",
        "name": "Ownership",
        "description": "Takes responsibility, sees things through",
        "category": "execution",
        "applicable_roles": ["all"],
        "icon": "shield-check",
        "question_text": "How much ownership do they take?",
        "low_anchor": "Passive",
        "high_anchor": "Full owner"
    },
    {
        "slug": "initiative",
        "name": "Initiative",
        "description": "Proactive, identifies and solves problems",
        "category": "execution",
        "applicable_roles": ["all"],
        "icon": "rocket",
        "question_text": "How proactive are they?",
        "low_anchor": "Waits for direction",
        "high_anchor": "Self-starter"
    },
    
    # Product Management
    {
        "slug": "product_vision",
        "name": "Product Vision",
        "description": "Strategic thinking, roadmap definition",
        "category": "execution",
        "applicable_roles": ["product"],
        "icon": "target",
        "question_text": "How strong is their product vision?",
        "low_anchor": "Tactical only",
        "high_anchor": "Visionary"
    },
    {
        "slug": "user_empathy",
        "name": "User Empathy",
        "description": "Understanding customer pain points",
        "category": "soft_skills",
        "applicable_roles": ["product"],
        "icon": "heart",
        "question_text": "How well do they understand users?",
        "low_anchor": "Disconnected",
        "high_anchor": "Deep empathy"
    },
    
    # Leadership
    {
        "slug": "people_management",
        "name": "People Management",
        "description": "Hiring, growth planning, team development",
        "category": "leadership",
        "applicable_roles": ["leadership"],
        "icon": "users-cog",
        "question_text": "How effective are they at managing people?",
        "low_anchor": "Struggles",
        "high_anchor": "Exceptional leader"
    },
    {
        "slug": "strategic_clarity",
        "name": "Strategic Clarity",
        "description": "Setting direction, long-term thinking",
        "category": "leadership",
        "applicable_roles": ["leadership"],
        "icon": "compass",
        "question_text": "How clearly do they set direction?",
        "low_anchor": "Unclear",
        "high_anchor": "Crystal clear vision"
    },
]


def seed_default_dimensions(db):
    """Seed the database with default rating dimensions."""
    from sqlalchemy import select
    
    for i, dim_data in enumerate(DEFAULT_DIMENSIONS):
        existing = db.execute(
            select(RatingDimension).where(RatingDimension.slug == dim_data["slug"])
        ).scalar_one_or_none()
        
        if not existing:
            dim = RatingDimension(
                **dim_data,
                display_order=i
            )
            db.add(dim)
    
    db.commit()
