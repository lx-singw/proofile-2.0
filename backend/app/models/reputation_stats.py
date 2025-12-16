"""
User Reputation Stats Model - Cached aggregated reputation scores

This is a read-model cache table for fast dashboard loads.
Recalculated asynchronously when new ratings are submitted.
"""

from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base, TimestampMixin


class UserReputationStats(Base, TimestampMixin):
    """
    Cached reputation statistics for a user.
    
    Updated asynchronously via Celery when:
    - New rating is submitted
    - Rating is modified/deleted
    - Verification status changes
    """
    __tablename__ = "user_reputation_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Aggregate scores (1.0 - 5.0 scale)
    global_score = Column(Float, default=0.0)
    manager_score = Column(Float, nullable=True)  # Score from managers only
    peer_score = Column(Float, nullable=True)     # Score from peers only
    
    # Review counts
    total_reviews = Column(Integer, default=0)
    manager_reviews = Column(Integer, default=0)
    peer_reviews = Column(Integer, default=0)
    verified_reviews = Column(Integer, default=0)
    
    # Dimension breakdown (JSONB)
    # { "communication": {"score": 4.8, "count": 12}, ... }
    dimension_scores = Column(JSON, default=dict)
    
    # Percentile ranking
    percentile = Column(Integer, default=0)  # 1-100
    
    # Trust signals/badges
    # ["top_rated", "manager_endorsed", "exceptional_communication"]
    signals = Column(JSON, default=list)
    
    # Historical tracking
    score_history = Column(JSON, default=list)  # Last 12 monthly scores
    
    # Cache metadata
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="reputation_stats")
    
    def to_dict(self) -> dict:
        """Convert to API response format."""
        return {
            "user_id": self.user_id,
            "global_score": self.global_score,
            "manager_score": self.manager_score,
            "peer_score": self.peer_score,
            "total_reviews": self.total_reviews,
            "dimension_scores": self.dimension_scores,
            "percentile": self.percentile,
            "signals": self.signals,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }
    
    def get_level(self) -> str:
        """Get reputation level based on score."""
        if self.global_score >= 4.8:
            return "platinum"
        elif self.global_score >= 4.5:
            return "gold"
        elif self.global_score >= 4.0:
            return "silver"
        elif self.global_score >= 3.0:
            return "bronze"
        else:
            return "unranked"
    
    def get_display_badge(self) -> dict:
        """Get display badge configuration."""
        level = self.get_level()
        badges = {
            "platinum": {"color": "#E5E4E2", "label": "Platinum", "icon": "crown"},
            "gold": {"color": "#FFD700", "label": "Gold", "icon": "star"},
            "silver": {"color": "#C0C0C0", "label": "Silver", "icon": "medal"},
            "bronze": {"color": "#CD7F32", "label": "Bronze", "icon": "award"},
            "unranked": {"color": "#9CA3AF", "label": "Unranked", "icon": "user"},
        }
        return {
            **badges[level],
            "score": self.global_score,
            "percentile": self.percentile
        }


class ReputationSnapshot(Base):
    """
    Historical reputation scores for trend analysis.
    Captures monthly snapshots for 'Growth over time' charts.
    """
    __tablename__ = "reputation_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Snapshot data
    global_score = Column(Float)
    total_reviews = Column(Integer)
    dimension_scores = Column(JSON)
    percentile = Column(Integer)
    
    # Snapshot timestamp (monthly)
    snapshot_date = Column(DateTime, nullable=False)
    
    # Relationships
    user = relationship("User", backref="reputation_history")
