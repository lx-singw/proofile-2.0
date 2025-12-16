"""
Project Collaborators API - Verified Work Graph

Endpoints:
- POST /collaborators - Invite a collaborator
- GET /collaborators/pending - Get pending requests (received)
- GET /collaborators/sent - Get pending requests (sent)
- GET /collaborators/{user_id} - Get verified collaborators for a user
- POST /collaborators/{request_id}/respond - Accept/Decline request
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime
from typing import Optional, List
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project_collaborator import ProjectCollaborator, CollaboratorStatus
from app.models.notification import Notification

router = APIRouter(prefix="/collaborators", tags=["collaborators"])
logger = logging.getLogger(__name__)

@router.post("", status_code=status.HTTP_201_CREATED)
async def invite_collaborator(
    collaborator_id: int, 
    project_name: str = Query(..., min_length=2),
    company: str = Query(..., min_length=2),
    role: str = Query(None),
    description: str = Query(None),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Invite a user to confirm collaboration on a project.
    """
    if collaborator_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")
    
    # Check if user exists
    collaborator_user = await session.get(User, collaborator_id)
    if not collaborator_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing pending/confirmed request for same project & user
    existing = await session.execute(
        select(ProjectCollaborator).where(
            and_(
                ProjectCollaborator.requester_id == current_user.id,
                ProjectCollaborator.collaborator_id == collaborator_id,
                ProjectCollaborator.project_name == project_name,
                ProjectCollaborator.status != CollaboratorStatus.DECLINED
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Collaboration request already exists for this project")

    collaborator = ProjectCollaborator(
        requester_id=current_user.id,
        collaborator_id=collaborator_id,
        project_name=project_name,
        company=company,
        role=role,
        description=description,
        start_date=start_date,
        end_date=end_date,
        status=CollaboratorStatus.PENDING
    )
    
    session.add(collaborator)
    
    # Create Notification for collaborator
    notification = Notification(
        user_id=collaborator_id,
        type="info",
        title="New Collaboration Request",
        message=f"{current_user.full_name} wants to verify a collaboration on '{project_name}'.",
        link="/profile",
        read=False
    )
    session.add(notification)
    
    await session.commit()
    await session.refresh(collaborator)
    
    return collaborator.to_dict()

@router.get("/pending")
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get collaboration requests waiting for my approval."""
    print(f"DEBUG: get_pending_requests for user {current_user.id}")
    query = select(ProjectCollaborator).where(
        and_(
            ProjectCollaborator.collaborator_id == current_user.id,
            ProjectCollaborator.status == CollaboratorStatus.PENDING
        )
    ).order_by(ProjectCollaborator.created_at.desc())
    
    result = await session.execute(query)
    items = result.scalars().all()
    print(f"DEBUG: Found {len(items)} pending items")
    
    # We need to fetch requester info manually or join
    # For simplicity, returning enriched dicts
    enriched_items = []
    for item in items:
        requester = await session.get(User, item.requester_id)
        data = item.to_dict()
        data['requester'] = {
            'id': requester.id,
            'full_name': requester.full_name,
            'username': requester.username,
            'avatar_url': requester.profile_photo_url
        }
        enriched_items.append(data)
        
    return enriched_items

@router.get("/user/{user_id}")
async def get_user_collaborations(
    user_id: int,
    session: AsyncSession = Depends(get_db)
):
    """
    Get verified (confirmed) collaborations for a user profile.
    Shows projects where this user was a collaborator OR a requester (and it was confirmed).
    """
    query = select(ProjectCollaborator).where(
        and_(
            or_(
                ProjectCollaborator.requester_id == user_id,
                ProjectCollaborator.collaborator_id == user_id
            ),
            ProjectCollaborator.status == CollaboratorStatus.CONFIRMED
        )
    ).order_by(ProjectCollaborator.end_date.desc().nullsfirst())
    
    result = await session.execute(query)
    items = result.scalars().all()
    
    enriched_items = []
    for item in items:
        # Determine "the other person"
        other_id = item.collaborator_id if item.requester_id == user_id else item.requester_id
        other_user = await session.get(User, other_id)
        
        data = item.to_dict()
        data['peer'] = {
            'id': other_user.id,
            'full_name': other_user.full_name,
            'username': other_user.username,
            'avatar_url': other_user.profile_photo_url
        }
        enriched_items.append(data)

    return enriched_items

@router.post("/{request_id}/respond")
async def respond_to_request(
    request_id: int,
    action: str = Query(..., regex="^(accept|decline)$"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Accept or Decline a collaboration request."""
    request = await session.get(ProjectCollaborator, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if request.collaborator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")
        
    if request.status != CollaboratorStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request is already {request.status}")
        
    if action == "accept":
        request.status = CollaboratorStatus.CONFIRMED
        message = "Collaboration confirmed"
        notif_title = "Collaboration Accepted"
        notif_msg = f"{current_user.full_name} confirmed your collaboration on '{request.project_name}'."
        notif_type = "success"
    else:
        request.status = CollaboratorStatus.DECLINED
        message = "Collaboration declined"
        notif_title = "Collaboration Declined"
        notif_msg = f"{current_user.full_name} declined your collaboration on '{request.project_name}'."
        notif_type = "warning"
    
    # Notify the original requester
    notification = Notification(
        user_id=request.requester_id,
        type=notif_type,
        title=notif_title,
        message=notif_msg,
        link="/profile",
        read=False
    )
    session.add(notification)
        
    await session.commit()
    return {"message": message, "status": request.status}
