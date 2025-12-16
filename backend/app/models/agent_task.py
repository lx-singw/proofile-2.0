"""
Agent Task Model

Tracks async task state for AI agents
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentTask(Base):
    __tablename__ = "agent_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    agent_type = Column(String(50), nullable=False)  # hunter, tailor, negotiator
    action = Column(String(255), nullable=False)
    status = Column(String(20), default=TaskStatus.PENDING)
    
    # Task metadata
    input_data = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    error_message = Column(String(500), nullable=True)
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="agent_tasks")
    
    def __repr__(self):
        return f"<AgentTask {self.id}: {self.agent_type} - {self.status}>"
