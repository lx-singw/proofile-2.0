from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.guild_service import GuildService
from pydantic import BaseModel

router = APIRouter(prefix="/guilds", tags=["community"])

# --- Schemas ---

class GuildResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    icon_url: Optional[str] = None
    min_trust_score: int
    member_count: int
    is_member: bool = False

    class Config:
        from_attributes = True

# --- Reputation Guard ---

async def reputation_guard(
    guild_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dependency that ensures a user meets the trust requirements of a guild 
    before allowing access to its sensitive resources.
    """
    service = GuildService(db)
    guild = await service.get_guild_by_slug(guild_slug)
    
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
        
    if current_user.trust_score < guild.min_trust_score:
        raise HTTPException(
            status_code=403, 
            detail={
                "error": "REPUTATION_GATE_LOCKED",
                "required": guild.min_trust_score,
                "current": current_user.trust_score,
                "message": f"You need a Trust Score of {guild.min_trust_score} to access this guild."
            }
        )
    return guild

# --- Endpoints ---

@router.get("/", response_model=List[GuildResponse])
async def list_guilds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = GuildService(db)
    # Seed guilds if empty (helper for development)
    await service.create_initial_guilds()
    
    guilds = await service.get_all_guilds()
    user_guild_ids = {g.id for g in await service.get_user_guilds(current_user.id)}
    
    results = []
    for g in guilds:
        g_dict = GuildResponse.from_orm(g)
        g_dict.is_member = g.id in user_guild_ids
        results.append(g_dict)
        
    return results

@router.post("/{slug}/join")
async def join_guild(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = GuildService(db)
    await service.join_guild(current_user, slug)
    return {"status": "joined", "guild": slug}

@router.delete("/{slug}/leave")
async def leave_guild(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = GuildService(db)
    await service.leave_guild(current_user, slug)
    return {"status": "left", "guild": slug}

@router.get("/{slug}/content", dependencies=[Depends(reputation_guard)])
async def get_exclusive_content(slug: str):
    """
    An example of a trust-gated endpoint.
    Only users meeting the 'reputation_guard' criteria can access this.
    """
    return {
        "status": "authorized",
        "content": f"Welcome to the exclusive {slug} guild! Here is your private briefing...",
        "exclusive_data": {"signals": "high-integrity", "alpha": "true"}
    }
