"""
AI Chat models: ChatSession, ChatMessage
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class ChatSession(Base, TimestampMixin):
    """AI chat session for a user."""
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)  # Auto-generated from first message
    session_type = Column(String(50), nullable=False, default="career_coach")  # career_coach, resume_help, job_search, etc.
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", backref="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base, TimestampMixin):
    """Individual message in a chat session."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)  # Track token usage for billing
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
