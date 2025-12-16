from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from .base import Base, TimestampMixin

class CollaboratorStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"

class ProjectCollaborator(Base, TimestampMixin):
    """
    Verified collaboration between two users on a specific project.
    Represents the "Verified Work Graph".
    """
    __tablename__ = "project_collaborators"

    id = Column(Integer, primary_key=True, index=True)
    
    # Who is claiming the collaboration
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Who they worked with (must be a user for verified graph)
    collaborator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Context
    project_name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True) # Requester's role on the project
    description = Column(Text, nullable=True) # What we did together
    
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # Verification
    status = Column(String(50), default=CollaboratorStatus.PENDING, nullable=False)
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="collaboration_requests_sent")
    collaborator = relationship("User", foreign_keys=[collaborator_id], backref="collaboration_requests_received")

    def to_dict(self):
        return {
            "id": self.id,
            "requester_id": self.requester_id,
            "collaborator_id": self.collaborator_id,
            "project_name": self.project_name,
            "company": self.company,
            "role": self.role,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            # Flattened for UI convenience often handled in router, but kept simple here
        }
