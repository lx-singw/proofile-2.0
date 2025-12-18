"""
Agent Control Plane API

Endpoints for managing AI agents (Hunter, Tailor, Negotiator)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.api import deps
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentStatus(str, Enum):
    ACTIVE = "active"
    IDLE = "idle"
    PAUSED = "paused"
    ERROR = "error"


class AgentType(str, Enum):
    HUNTER = "hunter"
    TAILOR = "tailor"
    NEGOTIATOR = "negotiator"


class AgentStatusResponse(BaseModel):
    id: str
    name: str
    status: AgentStatus
    last_run: Optional[datetime] = None
    message: Optional[str] = None
    stats: Optional[dict] = None


class AgentConfigUpdate(BaseModel):
    target_roles: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    min_match_score: Optional[int] = None
    scan_frequency: Optional[str] = None


class AgentTaskResponse(BaseModel):
    id: str
    agent_id: str
    action: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[dict] = None


@router.get("/", response_model=List[AgentStatusResponse])
async def get_all_agents(
    current_user: User = Depends(get_current_active_user)
):
    """Get status of all agents for the current user."""
    # Return mock data for now - in production, query from database
    return [
        AgentStatusResponse(
            id="hunter",
            name="Hunter Agent",
            status=AgentStatus.ACTIVE,
            last_run=datetime.now(),
            message="Scanning 142 jobs",
            stats={"found": 142, "qualified": 38}
        ),
        AgentStatusResponse(
            id="tailor",
            name="Tailor Agent",
            status=AgentStatus.IDLE,
            message="Ready to customize",
            stats={"tailored": 12, "pending": 3}
        ),
        AgentStatusResponse(
            id="negotiator",
            name="Negotiator Agent",
            status=AgentStatus.PAUSED,
            message="Premium feature",
            stats={}
        ),
    ]


@router.get("/{agent_id}", response_model=AgentStatusResponse)
async def get_agent_status(
    agent_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get status of a specific agent."""
    if agent_id not in ["hunter", "tailor", "negotiator"]:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return AgentStatusResponse(
        id=agent_id,
        name=f"{agent_id.title()} Agent",
        status=AgentStatus.ACTIVE,
        last_run=datetime.now(),
        message="Running"
    )


@router.post("/{agent_id}/start", response_model=AgentStatusResponse)
async def start_agent(
    agent_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Start or resume an agent."""
    if agent_id not in ["hunter", "tailor", "negotiator"]:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # TODO: Actually start the agent worker
    return AgentStatusResponse(
        id=agent_id,
        name=f"{agent_id.title()} Agent",
        status=AgentStatus.ACTIVE,
        last_run=datetime.now(),
        message="Started"
    )


@router.post("/{agent_id}/pause", response_model=AgentStatusResponse)
async def pause_agent(
    agent_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Pause an agent."""
    if agent_id not in ["hunter", "tailor", "negotiator"]:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return AgentStatusResponse(
        id=agent_id,
        name=f"{agent_id.title()} Agent",
        status=AgentStatus.PAUSED,
        message="Paused by user"
    )


@router.put("/{agent_id}/config")
async def update_agent_config(
    agent_id: str,
    config: AgentConfigUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update agent configuration."""
    if agent_id not in ["hunter", "tailor", "negotiator"]:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # TODO: Save config to database
    return {"message": "Configuration updated", "agent_id": agent_id}


@router.get("/{agent_id}/tasks", response_model=List[AgentTaskResponse])
async def get_agent_tasks(
    agent_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """Get task history for an agent."""
    # Return mock task history
    return [
        AgentTaskResponse(
            id="task-1",
            agent_id=agent_id,
            action="Scanned LinkedIn",
            status="completed",
            created_at=datetime.now(),
            completed_at=datetime.now(),
            result={"found": 12}
        )
    ]


@router.post("/{agent_id}/trigger", response_model=AgentTaskResponse)
async def trigger_agent(
    agent_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Manually trigger an agent run."""
    if agent_id not in ["hunter", "tailor", "negotiator"]:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # TODO: Queue Celery task
    return AgentTaskResponse(
        id=f"task-{datetime.now().timestamp()}",
        agent_id=agent_id,
        action="Manual trigger",
        status="pending",
        created_at=datetime.now()
    )
