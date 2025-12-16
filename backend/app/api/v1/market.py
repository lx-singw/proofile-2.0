"""
Market Intelligence API

Endpoints for salary data and market demand analytics
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/market", tags=["market"])


class SalaryRange(BaseModel):
    min: int
    max: int
    median: int
    percentile_25: int
    percentile_75: int


class SalaryData(BaseModel):
    role: str
    location: str
    range: SalaryRange
    sample_size: int
    last_updated: datetime


class SkillDemand(BaseModel):
    skill: str
    demand_score: int  # 0-100
    change_percent: float
    openings: int


class MarketOverview(BaseModel):
    total_openings: int
    average_salary: int
    top_skills: List[str]
    hot_locations: List[str]


@router.get("/salary", response_model=SalaryData)
async def get_salary_data(
    role: str = Query(..., description="Job role to query"),
    location: str = Query("Remote", description="Location"),
    current_user: User = Depends(get_current_active_user)
):
    """Get salary range for a role and location."""
    # Mock data - in production, query from aggregated market data
    return SalaryData(
        role=role,
        location=location,
        range=SalaryRange(
            min=120000,
            max=250000,
            median=175000,
            percentile_25=145000,
            percentile_75=210000
        ),
        sample_size=1250,
        last_updated=datetime.now()
    )


@router.get("/skills", response_model=List[SkillDemand])
async def get_skill_demand(
    skills: Optional[str] = Query(None, description="Comma-separated skill names"),
    current_user: User = Depends(get_current_active_user)
):
    """Get demand trends for skills."""
    # Mock trending data
    return [
        SkillDemand(skill="AI/ML", demand_score=92, change_percent=15.0, openings=5420),
        SkillDemand(skill="Product Strategy", demand_score=88, change_percent=8.0, openings=3210),
        SkillDemand(skill="B2B SaaS", demand_score=85, change_percent=5.0, openings=2890),
        SkillDemand(skill="Data Analytics", demand_score=78, change_percent=12.0, openings=4100),
        SkillDemand(skill="Agile/Scrum", demand_score=72, change_percent=-3.0, openings=6200),
    ]


@router.get("/overview", response_model=MarketOverview)
async def get_market_overview(
    current_user: User = Depends(get_current_active_user)
):
    """Get market overview for user's target roles."""
    return MarketOverview(
        total_openings=15420,
        average_salary=185000,
        top_skills=["AI/ML", "Product Strategy", "B2B SaaS"],
        hot_locations=["San Francisco", "New York", "Remote"]
    )
