from sqlalchemy.orm import Session
from sqlalchemy import func, update
from typing import List, Optional, Dict, Any
from app.models.guild import Guild, GuildMembership
from app.models.user import User
from fastapi import HTTPException

class GuildService:
    def __init__(self, db: Session):
        self.db = db

    async def get_all_guilds(self) -> List[Guild]:
        return self.db.query(Guild).filter(Guild.is_private == False).all()

    async def get_guild_by_slug(self, slug: str) -> Optional[Guild]:
        return self.db.query(Guild).filter(Guild.slug == slug).first()

    async def join_guild(self, user: User, guild_slug: str) -> GuildMembership:
        guild = await self.get_guild_by_slug(guild_slug)
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")

        # Trust Gating Check
        if user.trust_score < guild.min_trust_score:
            raise HTTPException(
                status_code=403, 
                detail=f"Trust Score too low. Required: {guild.min_trust_score}, Yours: {user.trust_score}"
            )

        # Check for existing membership
        existing = self.db.query(GuildMembership).filter(
            GuildMembership.user_id == user.id,
            GuildMembership.guild_id == guild.id
        ).first()
        
        if existing:
            return existing

        # Create membership
        membership = GuildMembership(
            user_id=user.id,
            guild_id=guild.id,
            role="member"
        )
        self.db.add(membership)
        
        # Atomically increment member count to avoid read-modify-write races
        self.db.execute(
            update(Guild).where(Guild.id == guild.id).values(
                member_count=Guild.member_count + 1
            )
        )
        
        self.db.commit()
        self.db.refresh(membership)
        return membership

    async def leave_guild(self, user: User, guild_slug: str):
        guild = await self.get_guild_by_slug(guild_slug)
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")

        membership = self.db.query(GuildMembership).filter(
            GuildMembership.user_id == user.id,
            GuildMembership.guild_id == guild.id
        ).first()

        if membership:
            self.db.delete(membership)
            # Atomically decrement, flooring at 0
            self.db.execute(
                update(Guild).where(Guild.id == guild.id).values(
                    member_count=func.greatest(0, Guild.member_count - 1)
                )
            )
            self.db.commit()

    async def get_user_guilds(self, user_id: int) -> List[Guild]:
        return self.db.query(Guild).join(GuildMembership).filter(
            GuildMembership.user_id == user_id
        ).all()

    async def create_initial_guilds(self):
        """Seed initial professional guilds if they don't exist."""
        initial_guilds = [
            {
                "name": "Platinum Architects",
                "slug": "platinum-architects",
                "description": "Elite system designers with 80+ Trust Score.",
                "min_trust_score": 80,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=arch"
            },
            {
                "name": "Gold Verified Engineers",
                "slug": "gold-engineers",
                "description": "Engineers with institutional Gold Badges.",
                "min_trust_score": 50,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=eng"
            },
            {
                "name": "Proofile Founders",
                "slug": "proofile-founders",
                "description": "The original community members of the platform.",
                "min_trust_score": 20,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=proof"
            }
        ]
        
        for g_data in initial_guilds:
            exists = self.db.query(Guild).filter(Guild.slug == g_data["slug"]).first()
            if not exists:
                guild = Guild(**g_data)
                self.db.add(guild)
        
        self.db.commit()
