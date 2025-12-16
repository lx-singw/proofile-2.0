"""
Ratings API Package

Router: /api/v1/ratings
"""

from fastapi import APIRouter
from app.api.v1.ratings.core import router as core_router
from app.api.v1.ratings.requests import router as requests_router
from app.api.v1.ratings.moderation import router as moderation_router
from app.api.v1.ratings.stats import router as stats_router
from app.api.v1.ratings.insights import router as insights_router

router = APIRouter(prefix="/ratings")

# Include sub-routers
router.include_router(core_router, tags=["ratings"])
router.include_router(requests_router, tags=["rating-requests"])
router.include_router(moderation_router, tags=["rating-moderation"])
router.include_router(stats_router, tags=["rating-stats"])
router.include_router(insights_router, tags=["career-insights"])
