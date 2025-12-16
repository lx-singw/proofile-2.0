"""
API Endpoints for Opportunities.
Renamed from jobs.py for the Jobs → Opportunities transformation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User, UserRole
from app.schemas.opportunity import OpportunityCreate, OpportunityRead, OpportunityRecommendationRead, OpportunityDetailRead
from app.services import opportunity_service

router = APIRouter()

@router.post("/", response_model=OpportunityRead, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    opportunity_in: OpportunityCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Create a new opportunity posting. Only accessible by users with the 'employer' role.
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can post opportunities.",
        )
    
    try:
        opportunity = await opportunity_service.create_opportunity(
            db=db, opportunity_in=opportunity_in, employer_id=current_user.id
        )
        return opportunity
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create opportunity posting"
        ) from e

@router.get("/", response_model=list[OpportunityRead])
async def list_opportunities(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10,
    verified_only: bool = False,
    category: str = Query(None, description="Filter by category: 'jobs' or 'training_skills_programs'"),
):
    """
    List all available opportunity postings.
    
    Args:
        verified_only: If True, only return opportunities that require verified candidates
        category: Filter by category ('jobs' or 'training_skills_programs')
    """
    opportunities = await opportunity_service.get_opportunities(
        db, skip=skip, limit=limit, verified_only=verified_only, category=category
    )
    return opportunities

@router.get("/recommendations", response_model=list[OpportunityRead])
async def get_opportunity_recommendations(
    limit: int = 5,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get opportunity recommendations for the current user.
    Uses smart matching based on profile headline and primary goal.
    """
    try:
        opportunities = await opportunity_service.get_recommended_opportunities(
            db, user=current_user, limit=limit
        )
        return opportunities
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Error in get_opportunity_recommendations: %s", e)
        # Fallback to recent opportunities if personalization fails
        opportunities = await opportunity_service.get_opportunities(db, skip=0, limit=limit)
        return opportunities

@router.get("/recommendations/advanced", response_model=list[OpportunityRecommendationRead])
async def get_advanced_opportunity_recommendations(
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get advanced opportunity recommendations with scoring breakdown.
    Matches based on skills, experience level, industry, and title.
    """
    try:
        results = await opportunity_service.get_recommended_opportunities_advanced(
            db, user=current_user, limit=limit
        )
        
        # Convert to response format
        return [
            {
                "opportunity": opportunity,
                "match_score": score,
                "score_breakdown": breakdown
            }
            for opportunity, score, breakdown in results
        ]
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Error in get_advanced_opportunity_recommendations: %s", e)
        # Return empty list on error rather than 500
        return []

@router.get("/saved", response_model=list[OpportunityRead])
async def get_saved_opportunities(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get all opportunities saved by the current user.
    """
    opportunities = await opportunity_service.get_saved_opportunities(db, user_id=current_user.id)
    return opportunities

@router.get("/{opportunity_id}", response_model=OpportunityDetailRead)
async def get_opportunity_details(
    opportunity_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get detailed opportunity information including save status and related opportunities.
    """
    opportunity = await opportunity_service.get_opportunity_by_id(db, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if user has saved this opportunity
    is_saved = await opportunity_service.is_opportunity_saved(
        db, user_id=current_user.id, opportunity_id=opportunity_id
    )
    
    # Get related opportunities
    related_opportunities = await opportunity_service.get_related_opportunities(
        db, opportunity, limit=5
    )
    
    return {
        "opportunity": opportunity,
        "is_saved": is_saved,
        "related_opportunities": related_opportunities
    }

@router.post("/{opportunity_id}/save", status_code=status.HTTP_201_CREATED)
async def save_opportunity(
    opportunity_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Save an opportunity for later review.
    """
    # Check if opportunity exists
    opportunity = await opportunity_service.get_opportunity_by_id(db, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if already saved
    if await opportunity_service.is_opportunity_saved(
        db, user_id=current_user.id, opportunity_id=opportunity_id
    ):
        raise HTTPException(status_code=400, detail="Opportunity already saved")
    
    try:
        await opportunity_service.save_opportunity(
            db, user_id=current_user.id, opportunity_id=opportunity_id
        )
        return {"message": "Opportunity saved successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save opportunity"
        ) from e

@router.delete("/{opportunity_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_opportunity(
    opportunity_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Remove a saved opportunity.
    """
    success = await opportunity_service.unsave_opportunity(
        db, user_id=current_user.id, opportunity_id=opportunity_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Saved opportunity not found")
    return None
