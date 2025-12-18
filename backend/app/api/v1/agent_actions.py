from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.api import deps
from app.models.user import User
from app.services.feed_service import FeedService
from app.services import ai_service
from app.api.deps import get_db, get_current_user
from sqlalchemy.orm import Session

router = APIRouter(prefix="/agent-actions", tags=["agent-actions"])

class AgentActionRequest(BaseModel):
    action_type: str  # "draft_cover" | "draft_message"
    metadata: Optional[dict] = None

@router.post("/feed/{post_id}", response_model=dict)
async def execute_agent_action(
    post_id: int,
    request: AgentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute an AI-driven agentic action based on a feed post.
    """
    feed_service = FeedService(db)
    post = feed_service.get_post(post_id, current_user.id)
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if request.action_type == "draft_cover":
        # Extract job data from post content or metadata
        # For now, we'll assume a simplified job structure
        job_data = {
            "title": post.metadata.get("job_title", "Position") if post.metadata else "Position",
            "company": post.metadata.get("company_name", "Company") if post.metadata else "Company",
            "description": post.content
        }
        
        # Get user profile data
        user_data = {
            "profile": {
                "full_name": current_user.full_name,
                "headline": current_user.headline,
                "email": current_user.email
            }
        }
        
        draft = await ai_service.generate_cover_letter(user_data, job_data)
        return {"draft": draft, "type": "cover_letter"}

    elif request.action_type == "draft_message":
        recipient_name = post.user.full_name or post.user.username
        milestone = post.type.value if hasattr(post.type, 'value') else str(post.type)
        
        draft = await ai_service.generate_congrats_message(
            sender_name=current_user.full_name or current_user.username,
            recipient_name=recipient_name,
            milestone_type=milestone
        )
        return {"draft": draft, "type": "congrats_message"}

    else:
        raise HTTPException(status_code=400, detail="Unsupported action type")
