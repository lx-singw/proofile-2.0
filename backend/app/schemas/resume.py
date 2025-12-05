from __future__ import annotations
from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import Any, Optional, List
from datetime import datetime
from uuid import UUID

class ResumeBase(BaseModel):
    name: str
    template_id: str = 'modern'

class ResumeCreate(ResumeBase):
    data: Optional[dict] = Field(default_factory=dict)

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    template_id: Optional[str] = None
    data: Optional[Any] = None

class ResumeRead(ResumeBase):
    id: UUID
    user_id: int
    template_id: str
    data: Any = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status: str = 'draft'
    ats_score: Optional[int] = None
    analysis_results: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

class ResumeListItem(BaseModel):
    id: UUID
    name: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
