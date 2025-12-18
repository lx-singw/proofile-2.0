from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class PortfolioItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    media_url: Optional[str] = None
    external_url: Optional[str] = None
    experience_id: Optional[UUID] = None

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    media_url: Optional[str] = None
    external_url: Optional[str] = None
    experience_id: Optional[UUID] = None

class PortfolioItemInDBBase(PortfolioItemBase):
    id: UUID
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class PortfolioItem(PortfolioItemInDBBase):
    pass
