from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional
from uuid import UUID

class ExperienceBase(BaseModel):
    company: str
    title: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    description: Optional[str] = None
    is_current: bool = False

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    is_current: Optional[bool] = None

class ExperienceInDBBase(ExperienceBase):
    id: UUID
    user_id: int
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)

class Experience(ExperienceInDBBase):
    pass
