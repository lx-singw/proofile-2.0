"""
Service layer for opportunity-related operations.
Renamed from job_service.py for the Jobs → Opportunities transformation.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from typing import TYPE_CHECKING
from app.models.opportunity import Opportunity
from app.schemas.opportunity import OpportunityCreate

if TYPE_CHECKING:
    from app.models.user import User


async def create_opportunity(db: AsyncSession, opportunity_in: OpportunityCreate, employer_id: int) -> Opportunity:
    """
    Create a new opportunity posting.
    """
    opportunity_data = opportunity_in.model_dump()
    if opportunity_data.get("required_skills") is not None and isinstance(opportunity_data["required_skills"], list):
        opportunity_data["required_skills"] = json.dumps(opportunity_data["required_skills"])

    new_opportunity = Opportunity(**opportunity_data, employer_id=employer_id)
    db.add(new_opportunity)
    await db.commit()
    await db.refresh(new_opportunity)
    return new_opportunity


async def get_opportunities(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    verified_only: bool = False,
    category: str = None  # 'jobs', 'training_skills_programs', or None for all
) -> list[Opportunity]:
    """
    Retrieve opportunity postings with pagination.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        verified_only: If True, only return opportunities that require verified candidates
        category: Filter by category ('jobs' or 'training_skills_programs')
    """
    query = select(Opportunity)
    
    if verified_only:
        # Filter for opportunities that require verification
        query = query.where(
            (Opportunity.verified_candidates_only == True) | 
            (Opportunity.requires_verification_level >= 2)
        )
    
    if category:
        query = query.where(Opportunity.category == category)
    
    query = query.offset(skip).limit(limit).order_by(Opportunity.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_recommended_opportunities(db: AsyncSession, user: "User", limit: int = 5) -> list[Opportunity]:
    """
    Get opportunity recommendations sorted by relevance to the user.
    Relevance is calculated based on:
    - Industry match
    - Title matching User.primary_goal
    - Title/description matching Profile.headline
    """
    # 1. Fetch a pool of recent opportunities (e.g., last 100)
    result = await db.execute(select(Opportunity).order_by(Opportunity.created_at.desc()).limit(100))
    candidate_opportunities = result.scalars().all()

    # 2. Extract user signals
    user_industry = (user.industry or "").lower()
    user_goal = (user.primary_goal or "").lower()
    user_headline = ""
    user_profile = getattr(user, 'profile', None)
    if user_profile and getattr(user_profile, 'headline', None):
        user_headline = user_profile.headline.lower()
    
    scored_opportunities = []
    
    for opportunity in candidate_opportunities:
        score = 0
        opp_title = opportunity.title.lower()
        opp_desc = opportunity.description.lower()
        
        # Scoring Rules
        
        # A. Primary Goal in Title (High impact)
        if user_goal and user_goal in opp_title:
            score += 50
            
        # B. Headline keywords in Title (Medium impact)
        if user_headline:
            headline_tokens = set(user_headline.split())
            title_tokens = set(opp_title.split())
            overlap = headline_tokens.intersection(title_tokens)
            score += len(overlap) * 10
            
        # C. Industry match
        if user_industry and user_industry in opp_desc:
            score += 20
        
        scored_opportunities.append((opportunity, score))
        
    # 3. Sort by score descending
    scored_opportunities.sort(key=lambda x: x[1], reverse=True)
    
    # 4. Return top N opportunities
    return [opp for opp, score in scored_opportunities[:limit]]


async def get_recommended_opportunities_advanced(
    db: AsyncSession, 
    user: "User", 
    limit: int = 10
) -> list[tuple[Opportunity, int, dict]]:
    """
    Advanced opportunity matching with category-specific scoring.
    
    Uses different weights based on user's opportunity_preference:
    - Jobs: Skills (35%), Experience (25%), Industry (15%), Salary (15%), Location (10%)
    - Training: Education (30%), Career Goals (25%), Skill Gaps (20%), SETA (15%), Location (10%)
    
    Returns: List of (opportunity, total_score, score_breakdown) tuples
    """
    
    # Get user's opportunity preference
    user_preference = getattr(user, 'opportunity_preference', None) or 'both'
    
    # Fetch candidate opportunities, filtered by category if user has preference
    query = select(Opportunity).order_by(Opportunity.created_at.desc()).limit(100)
    
    # If user has a specific preference (not 'both'), prioritize that category
    if user_preference != 'both':
        # First get opportunities matching preference
        pref_query = query.where(Opportunity.category == user_preference)
        pref_result = await db.execute(pref_query)
        candidate_opportunities = list(pref_result.scalars().all())
        
        # If not enough, backfill with other opportunities
        if len(candidate_opportunities) < limit * 2:
            other_result = await db.execute(query)
            other_opportunities = list(other_result.scalars().all())
            seen_ids = {o.id for o in candidate_opportunities}
            for opp in other_opportunities:
                if opp.id not in seen_ids:
                    candidate_opportunities.append(opp)
                    if len(candidate_opportunities) >= 100:
                        break
    else:
        result = await db.execute(query)
        candidate_opportunities = list(result.scalars().all())
    
    # Parse user skills
    user_skills_list = []
    if user.skills:
        try:
            user_skills_list = json.loads(user.skills) if isinstance(user.skills, str) else user.skills
        except:
            user_skills_list = []
    
    scored_opportunities = []
    
    for opportunity in candidate_opportunities:
        opp_category = getattr(opportunity, 'category', 'jobs') or 'jobs'
        
        # Use category-specific weights
        if opp_category == 'training_skills_programs':
            # Training & Skills Programs weights (based on doc Section 3)
            weights = {
                "education": 30,      # NQF level, qualifications
                "goals": 25,          # Career path alignment
                "skill_gaps": 20,     # Development areas
                "seta": 15,           # SETA registration
                "location": 10        # In-person vs online
            }
            breakdown = {
                "title_match": 0,       # Maps to goals
                "skills_match": 0,      # Maps to skill_gaps
                "experience_match": 0,  # Maps to education
                "industry_match": 0,    # Maps to seta/sector
                "verification_match": 0
            }
            
            # Career Goals match (title in goals context)
            if user.primary_goal:
                goal_lower = user.primary_goal.lower()
                title_lower = opportunity.title.lower()
                desc_lower = (opportunity.description or "").lower()
                
                # Match against training keywords
                training_keywords = ['learnership', 'internship', 'apprenticeship', 'training', 'graduate', 'entry']
                goal_in_content = goal_lower in title_lower or goal_lower in desc_lower
                
                if goal_in_content:
                    breakdown["title_match"] = int(weights["goals"] * 1.5)  # Boost for goal match
                elif any(kw in title_lower for kw in training_keywords):
                    breakdown["title_match"] = weights["goals"]
            
            # Skill Gaps match (what user could learn)
            if user_skills_list and opportunity.required_skills:
                try:
                    opp_skills_list = json.loads(opportunity.required_skills) if isinstance(opportunity.required_skills, str) else opportunity.required_skills
                    user_skills = set(s.lower() for s in user_skills_list)
                    opp_skills = set(s.lower() for s in opp_skills_list)
                    
                    # For training, we want skills user DOESN'T have yet (skill gaps)
                    skill_gap = opp_skills - user_skills
                    if opp_skills:
                        gap_pct = len(skill_gap) / len(opp_skills)
                        # Higher score for more skill gap (training opportunity)
                        breakdown["skills_match"] = int(gap_pct * weights["skill_gaps"])
                except:
                    pass
            
            # Education/Experience level (maps to NQF requirements)
            if user.experience_level and opportunity.experience_level:
                # For training, entry/junior levels are better matches
                exp_map = {"entry": 4, "mid": 2, "senior": 1, "lead": 0}  # Inverted for training
                user_exp = exp_map.get(user.experience_level, 2)
                opp_exp = exp_map.get(opportunity.experience_level, 2)
                if user_exp >= opp_exp:  # User at or above required level
                    breakdown["experience_match"] = weights["education"]
                elif abs(user_exp - opp_exp) == 1:
                    breakdown["experience_match"] = weights["education"] // 2
            
            # Industry/SETA match
            if user.industry and opportunity.industry:
                if user.industry.lower() == opportunity.industry.lower():
                    breakdown["industry_match"] = weights["seta"]
                    
        else:
            # Jobs category weights (based on doc Section 3)
            weights = {
                "skills": 35,
                "experience": 25,
                "industry": 15,
                "salary": 15,
                "location": 10
            }
            breakdown = {
                "title_match": 0,
                "skills_match": 0,
                "experience_match": 0,
                "industry_match": 0,
                "verification_match": 0
            }
            
            # Title matching (still important for jobs)
            if user.primary_goal:
                goal_lower = user.primary_goal.lower()
                title_lower = opportunity.title.lower()
                if goal_lower in title_lower:
                    breakdown["title_match"] = 50
                elif any(word in title_lower for word in goal_lower.split()):
                    breakdown["title_match"] = 25
            
            # Skills matching (heavily weighted for jobs)
            if user_skills_list and opportunity.required_skills:
                try:
                    opp_skills_list = json.loads(opportunity.required_skills) if isinstance(opportunity.required_skills, str) else opportunity.required_skills
                    user_skills = set(s.lower() for s in user_skills_list)
                    opp_skills = set(s.lower() for s in opp_skills_list)
                    matching_skills = user_skills.intersection(opp_skills)
                    if opp_skills:
                        match_pct = len(matching_skills) / len(opp_skills)
                        breakdown["skills_match"] = int(match_pct * weights["skills"])
                except:
                    pass
            
            # Experience level match
            if user.experience_level and opportunity.experience_level:
                exp_map = {"entry": 1, "mid": 2, "senior": 3, "lead": 4}
                user_exp = exp_map.get(user.experience_level, 0)
                opp_exp = exp_map.get(opportunity.experience_level, 0)
                if user_exp == opp_exp:
                    breakdown["experience_match"] = weights["experience"]
                elif abs(user_exp - opp_exp) == 1:
                    breakdown["experience_match"] = weights["experience"] // 2
            
            # Industry match
            if user.industry and opportunity.industry:
                if user.industry.lower() == opportunity.industry.lower():
                    breakdown["industry_match"] = weights["industry"]
        
        # Verification boost (applies to both categories)
        user_trust_score = getattr(user, 'trust_score', 0) or 0
        opp_requires_verification = getattr(opportunity, 'requires_verification_level', 0) or 0
        opp_verified_only = getattr(opportunity, 'verified_candidates_only', False)
        
        if opp_requires_verification >= 2 or opp_verified_only:
            if user_trust_score >= 70:
                breakdown["verification_match"] = 30
            elif user_trust_score >= 50:
                breakdown["verification_match"] = 20
            elif user_trust_score >= 30:
                breakdown["verification_match"] = 10
        
        # Category preference boost
        if user_preference != 'both' and opp_category == user_preference:
            breakdown["title_match"] += 15  # Boost for matching category
        
        total_score = sum(breakdown.values())
        scored_opportunities.append((opportunity, total_score, breakdown))
    
    # Sort by score descending
    scored_opportunities.sort(key=lambda x: x[1], reverse=True)
    return scored_opportunities[:limit]


async def get_opportunity_by_id(db: AsyncSession, opportunity_id: int) -> Opportunity | None:
    """Get an opportunity by ID."""
    result = await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))
    return result.scalar_one_or_none()


async def get_opportunity_by_slug(db: AsyncSession, slug: str) -> Opportunity | None:
    """Get an opportunity by slug."""
    result = await db.execute(select(Opportunity).where(Opportunity.slug == slug))
    return result.scalar_one_or_none()


async def save_opportunity(db: AsyncSession, user_id: int, opportunity_id: int, notes: str = None):
    """Save an opportunity for later review."""
    from app.models.saved_opportunity import SavedOpportunity
    
    saved_opportunity = SavedOpportunity(user_id=user_id, opportunity_id=opportunity_id, notes=notes)
    db.add(saved_opportunity)
    await db.commit()
    await db.refresh(saved_opportunity)
    return saved_opportunity


async def unsave_opportunity(db: AsyncSession, user_id: int, opportunity_id: int) -> bool:
    """Remove a saved opportunity."""
    from app.models.saved_opportunity import SavedOpportunity
    from sqlalchemy import delete
    
    result = await db.execute(
        delete(SavedOpportunity).where(
            SavedOpportunity.user_id == user_id,
            SavedOpportunity.opportunity_id == opportunity_id
        )
    )
    await db.commit()
    return result.rowcount > 0


async def get_saved_opportunities(db: AsyncSession, user_id: int) -> list[Opportunity]:
    """Get all saved opportunities for a user."""
    from app.models.saved_opportunity import SavedOpportunity
    
    result = await db.execute(
        select(Opportunity)
        .join(SavedOpportunity, SavedOpportunity.opportunity_id == Opportunity.id)
        .where(SavedOpportunity.user_id == user_id)
        .order_by(SavedOpportunity.saved_at.desc())
    )
    return list(result.scalars().all())


async def is_opportunity_saved(db: AsyncSession, user_id: int, opportunity_id: int) -> bool:
    """Check if an opportunity is saved by the user."""
    from app.models.saved_opportunity import SavedOpportunity
    
    result = await db.execute(
        select(SavedOpportunity).where(
            SavedOpportunity.user_id == user_id,
            SavedOpportunity.opportunity_id == opportunity_id
        )
    )
    return result.scalar_one_or_none() is not None


async def get_related_opportunities(db: AsyncSession, opportunity: Opportunity, limit: int = 5) -> list[Opportunity]:
    """Get opportunities related to the given opportunity (same industry or category)."""
    query = select(Opportunity).where(Opportunity.id != opportunity.id)
    
    if opportunity.industry:
        query = query.where(Opportunity.industry == opportunity.industry)
    
    if opportunity.category:
        query = query.where(Opportunity.category == opportunity.category)
    
    query = query.order_by(Opportunity.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


# ============================================================================
# Backward compatibility aliases for Job functions
# ============================================================================

# Alias old function names to new ones
create_job = create_opportunity
get_jobs = get_opportunities
get_recommended_jobs = get_recommended_opportunities
get_recommended_jobs_advanced = get_recommended_opportunities_advanced
get_job_by_id = get_opportunity_by_id
save_job = save_opportunity
unsave_job = unsave_opportunity
get_saved_jobs = get_saved_opportunities
is_job_saved = is_opportunity_saved
get_related_jobs = get_related_opportunities
