"""
AI API: Profile suggestions, job matching, and chat
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from pydantic import BaseModel
import asyncio

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.profile import Profile
from app.core.config import settings
from app.services.ai_service import (
    optimize_bullet_streaming,
    analyse_skill_gap,
    generate_interview_questions,
    score_profile_completeness,
    optimise_for_ats,
)

router = APIRouter()


# ============ Schemas ============

class ProfileSuggestion(BaseModel):
    id: str
    type: str  # headline, summary, skill, experience
    original: Optional[str] = None
    suggestion: str
    reason: str
    impact: str


class JobMatch(BaseModel):
    id: str
    title: str
    company: str
    company_logo: Optional[str] = None
    location: str
    salary_range: Optional[str] = None
    posted_at: str
    match_score: int
    match_reasons: List[str]
    is_remote: bool = False
    is_featured: bool = False


# ============ Optimize Bullet (streaming via ai_service) ============

class OptimizeBulletPayload(BaseModel):
    text: str
    context: Optional[str] = ""

@router.post("/optimize-bullet")
async def optimize_bullet(
    payload: OptimizeBulletPayload,
    current_user = Depends(get_current_active_user)
):
    """Stream an AI-improved version of a resume bullet point."""
    return StreamingResponse(
        optimize_bullet_streaming(payload.text, payload.context or ""),
        media_type="text/plain",
    )


# ============ Profile Suggestions ============

@router.get("/profile-suggestions", response_model=List[ProfileSuggestion])
async def get_profile_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI-powered profile improvement suggestions."""
    # Get user's profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    suggestions = []
    
    # Headline suggestion
    current_headline = profile.headline if profile else None
    if not current_headline or len(current_headline) < 30:
        suggestions.append(ProfileSuggestion(
            id="1",
            type="headline",
            original=current_headline,
            suggestion="Senior Full-Stack Engineer | React & Node.js | Building Scalable Web Applications",
            reason="Headlines with specific technologies and seniority get 2.5x more views from recruiters.",
            impact="+150% profile views"
        ))
    
    # Skill suggestion based on profile data
    skills = profile.skills_data if profile and profile.skills_data else []
    if len(skills) < 5:
        suggestions.append(ProfileSuggestion(
            id="2",
            type="skill",
            suggestion="Add 'System Design' to your skills",
            reason="Based on your experience level and role, this skill is commonly expected and improves job matching.",
            impact="+40% job matches"
        ))
    
    # Summary suggestion
    summary = profile.summary if profile else None
    if not summary or len(summary) < 100:
        suggestions.append(ProfileSuggestion(
            id="3",
            type="summary",
            original=summary,
            suggestion="Start with a strong action statement highlighting your 5+ years of experience and key achievements.",
            reason="Summaries that lead with impact metrics capture attention in the first 3 seconds.",
            impact="+75% engagement"
        ))
    
    return suggestions


@router.post("/profile-suggestions/{suggestion_id}/apply")
async def apply_profile_suggestion(
    suggestion_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Apply a profile suggestion."""
    # In production, this would apply the suggestion to the profile
    return {"status": "applied", "suggestion_id": suggestion_id}


# ============ Job Matching ============

@router.get("/job-matches", response_model=List[JobMatch])
async def get_job_matches(
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI-matched job recommendations based on profile."""
    # Get user's profile for matching
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    # Generate sample job matches (in production, query jobs table and ML model)
    import random
    
    sample_jobs = [
        JobMatch(
            id="1",
            title="Senior Frontend Engineer",
            company="Stripe",
            location="San Francisco, CA",
            salary_range="$180k - $250k",
            posted_at="2d ago",
            match_score=95,
            match_reasons=["React expert", "5+ years exp", "TypeScript"],
            is_featured=True
        ),
        JobMatch(
            id="2",
            title="Staff Software Engineer",
            company="Notion",
            location="Remote",
            salary_range="$200k - $280k",
            posted_at="1w ago",
            match_score=88,
            match_reasons=["Full-stack skills", "Startup experience"],
            is_remote=True
        ),
        JobMatch(
            id="3",
            title="Engineering Manager",
            company="Figma",
            location="San Francisco, CA",
            salary_range="$220k - $300k",
            posted_at="3d ago",
            match_score=82,
            match_reasons=["Leadership skills", "Design systems"]
        ),
        JobMatch(
            id="4",
            title="Principal Engineer",
            company="Anthropic",
            location="San Francisco, CA",
            salary_range="$300k - $400k",
            posted_at="1d ago",
            match_score=78,
            match_reasons=["AI/ML experience", "System design"],
            is_featured=True
        ),
        JobMatch(
            id="5",
            title="Senior Product Engineer",
            company="Linear",
            location="Remote",
            salary_range="$170k - $220k",
            posted_at="5d ago",
            match_score=75,
            match_reasons=["Product focus", "Frontend skills"],
            is_remote=True
        ),
    ]
    
    return sample_jobs[:limit]


# ============ Skill Gap Analysis ============

class SkillGapPayload(BaseModel):
    user_skills: List[str]
    job_description: str
    target_role: Optional[str] = None

@router.post("/skill-gap")
async def skill_gap_analysis(
    payload: SkillGapPayload,
    current_user = Depends(get_current_active_user),
):
    """Analyse the gap between a user's skills and a job description."""
    try:
        return await analyse_skill_gap(
            user_skills=payload.user_skills,
            job_description=payload.job_description,
            target_role=payload.target_role,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


# ============ Interview Question Generator ============

class InterviewQuestionsPayload(BaseModel):
    job_description: str
    question_types: Optional[List[str]] = None  # e.g. ['behavioural', 'technical']
    count: int = 10

@router.post("/interview-questions")
async def interview_questions(
    payload: InterviewQuestionsPayload,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """Generate tailored interview questions for a job description."""
    # Enrich with the user's actual profile for more targeted questions
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    user_profile = {
        "skills": getattr(profile, "skills_data", []),
        "headline": getattr(profile, "headline", ""),
        "experience_years": getattr(current_user, "years_experience", None),
    }
    try:
        return await generate_interview_questions(
            job_description=payload.job_description,
            user_profile=user_profile,
            question_types=payload.question_types,
            count=payload.count,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


# ============ Profile Completeness Score ============

@router.get("/profile-score")
async def profile_score(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """Score the authenticated user's profile on completeness and quality."""
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()

    profile_dict = {
        "headline": getattr(profile, "headline", None),
        "summary": getattr(profile, "summary", None),
        "skills": getattr(profile, "skills_data", []),
        "avatar_url": getattr(profile, "avatar_url", None),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "location": getattr(current_user, "city", None),
    }
    try:
        return await score_profile_completeness(profile_dict)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


# ============ ATS Keyword Optimiser ============

class ATSOptimisePayload(BaseModel):
    resume_text: str
    job_description: str

@router.post("/ats-optimise")
async def ats_optimise(
    payload: ATSOptimisePayload,
    current_user = Depends(get_current_active_user),
):
    """Identify missing ATS keywords and suggest targeted edits."""
    try:
        return await optimise_for_ats(
            resume_text=payload.resume_text,
            job_description=payload.job_description,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
