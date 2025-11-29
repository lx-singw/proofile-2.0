from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.api import deps
from app.models.activity import Activity
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ActivityRead(BaseModel):
    id: int
    action_type: str
    description: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/recent", response_model=List[ActivityRead])
async def get_recent_activities(
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get recent activities for the current user.
    """
    result = await db.execute(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(desc(Activity.created_at))
        .limit(limit)
    )
    return result.scalars().all()
