from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update, func
from app.api import deps
from app.models.notification import Notification
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    message: str
    link: Optional[str] = None
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[NotificationRead])
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get notifications for the current user.
    """
    print(f"DEBUG: get_notifications for user {current_user.id}")
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    print(f"DEBUG: Found {len(items)} notifications")
    return items

@router.get("/unread-count", response_model=int)
async def get_unread_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get count of unread notifications.
    """
    print(f"DEBUG: get_unread_count for user {current_user.id}")
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id, Notification.read == False)
    )
    count = result.scalar() or 0
    print(f"DEBUG: Unread count: {count}")
    return count

@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Mark a notification as read.
    """
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.read = True
    await db.commit()
    await db.refresh(notification)
    return notification

@router.post("/read-all", status_code=204)
async def mark_all_as_read(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Mark all notifications as read.
    """
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
