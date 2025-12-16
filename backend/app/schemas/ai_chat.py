"""
AI Chat schemas for API requests/responses.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000, description="Message content")


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    tokens_used: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    session_type: str = Field("career_coach", description="Type of chat session")
    initial_message: Optional[str] = Field(None, description="Optional first message")


class ChatSessionResponse(BaseModel):
    id: int
    title: Optional[str]
    session_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionWithMessages(ChatSessionResponse):
    """Chat session with all messages."""
    messages: List[ChatMessageResponse]


class ChatRequest(BaseModel):
    """Request to send a message and get AI response."""
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[int] = Field(None, description="Existing session ID, or None to create new")
    session_type: str = Field("career_coach", description="Type of chat if creating new session")


class ChatResponse(BaseModel):
    """Response from AI chat."""
    session_id: int
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class ProfileInsight(BaseModel):
    """AI-generated insight about user's profile."""
    category: str  # skills, experience, education, etc.
    title: str
    description: str
    priority: str  # high, medium, low
    action_url: Optional[str]


class ProfileAnalysis(BaseModel):
    """Complete AI analysis of user's profile."""
    completeness_score: int  # 0-100
    strengths: List[str]
    improvements: List[ProfileInsight]
    career_opportunities: List[str]
    skill_gaps: List[str]
