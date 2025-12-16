"""
Skills Verification API Routes (L1)
Handles skill assessments and peer endorsements
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.verification import Verification

router = APIRouter(prefix="/skills", tags=["skills-verification"])


class SkillAssessmentRequest(BaseModel):
    """Request to start skill assessment"""
    skill_slug: str  # e.g., "python", "react", "project-management"


class SkillAssessmentResponse(BaseModel):
    """Response with assessment details"""
    assessment_id: str
    skill_slug: str
    skill_name: str
    questions_count: int
    time_limit_minutes: int


class SubmitAnswerRequest(BaseModel):
    """Submit answer for a question"""
    question_id: str
    answer: str


class AssessmentResultResponse(BaseModel):
    """Final assessment result"""
    assessment_id: str
    skill_slug: str
    score: int
    passed: bool
    correct_answers: int
    total_questions: int
    verified: bool


class PeerEndorsementRequest(BaseModel):
    """Request peer endorsement for a skill"""
    skill_slug: str
    peer_emails: List[str]
    message: Optional[str] = None


# Mock skill data - in production, this would be in a database
SKILLS = {
    "python": {"name": "Python", "questions": 10, "time": 15, "pass_score": 70},
    "react": {"name": "React", "questions": 10, "time": 15, "pass_score": 70},
    "sql": {"name": "SQL", "questions": 10, "time": 15, "pass_score": 70},
    "project-management": {"name": "Project Management", "questions": 10, "time": 20, "pass_score": 70},
}


@router.post("/assess/start", response_model=SkillAssessmentResponse)
async def start_skill_assessment(
    request: SkillAssessmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a new skill assessment"""
    skill = SKILLS.get(request.skill_slug)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill '{request.skill_slug}' not found"
        )
    
    # Check for existing verified skill
    existing = db.query(Verification).filter(
        Verification.user_id == current_user.id,
        Verification.target_type == "skill",
        Verification.metadata.op("->")("skill_slug").astext == request.skill_slug,
        Verification.status == "verified"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skill already verified"
        )
    
    # Create assessment record
    assessment_id = f"assess_{current_user.id}_{request.skill_slug}_{int(datetime.utcnow().timestamp())}"
    
    verification = Verification(
        user_id=current_user.id,
        target_type="skill",
        method="test",
        status="pending",
        provider_id=assessment_id,
        metadata={
            "skill_slug": request.skill_slug,
            "skill_name": skill["name"],
            "started_at": datetime.utcnow().isoformat(),
            "questions_count": skill["questions"],
            "time_limit": skill["time"]
        }
    )
    db.add(verification)
    db.commit()
    
    return SkillAssessmentResponse(
        assessment_id=assessment_id,
        skill_slug=request.skill_slug,
        skill_name=skill["name"],
        questions_count=skill["questions"],
        time_limit_minutes=skill["time"]
    )


@router.get("/assess/{assessment_id}/questions")
async def get_assessment_questions(
    assessment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get questions for an assessment"""
    verification = db.query(Verification).filter(
        Verification.provider_id == assessment_id,
        Verification.user_id == current_user.id,
        Verification.status == "pending"
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found or already completed"
        )
    
    # Mock questions - in production, fetch from question_bank table
    skill_slug = verification.metadata.get("skill_slug")
    questions = [
        {
            "id": f"q_{i}",
            "text": f"Sample question {i + 1} for {skill_slug}",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "order": i + 1
        }
        for i in range(verification.metadata.get("questions_count", 10))
    ]
    
    return {
        "assessment_id": assessment_id,
        "skill": verification.metadata.get("skill_name"),
        "questions": questions,
        "time_limit_minutes": verification.metadata.get("time_limit", 15)
    }


@router.post("/assess/{assessment_id}/submit", response_model=AssessmentResultResponse)
async def submit_assessment(
    assessment_id: str,
    answers: List[SubmitAnswerRequest],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit answers and get result"""
    verification = db.query(Verification).filter(
        Verification.provider_id == assessment_id,
        Verification.user_id == current_user.id,
        Verification.status == "pending"
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    skill_slug = verification.metadata.get("skill_slug")
    skill = SKILLS.get(skill_slug, {})
    pass_score = skill.get("pass_score", 70)
    
    # Mock scoring - in production, compare with correct answers
    total_questions = len(answers)
    correct = int(total_questions * 0.8)  # Mock 80% correct
    score = int((correct / total_questions) * 100) if total_questions > 0 else 0
    passed = score >= pass_score
    
    # Update verification
    verification.status = "verified" if passed else "rejected"
    verification.verified_at = datetime.utcnow() if passed else None
    verification.metadata["score"] = score
    verification.metadata["correct_answers"] = correct
    verification.metadata["completed_at"] = datetime.utcnow().isoformat()
    
    if passed:
        # Update trust score
        from app.services.trust_score_engine import update_trust_score
        await update_trust_score(current_user.id, "skill_verified", db)
    
    db.commit()
    
    return AssessmentResultResponse(
        assessment_id=assessment_id,
        skill_slug=skill_slug,
        score=score,
        passed=passed,
        correct_answers=correct,
        total_questions=total_questions,
        verified=passed
    )


@router.post("/endorse")
async def request_peer_endorsement(
    request: PeerEndorsementRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Request peer endorsement for a skill"""
    if len(request.peer_emails) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 peer requests at a time"
        )
    
    # Validate skill exists
    if request.skill_slug not in SKILLS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # Create pending verification
    verification = Verification(
        user_id=current_user.id,
        target_type="skill",
        method="peer",
        status="pending",
        metadata={
            "skill_slug": request.skill_slug,
            "skill_name": SKILLS[request.skill_slug]["name"],
            "peer_emails": request.peer_emails,
            "message": request.message,
            "endorsements_received": 0,
            "endorsements_required": min(2, len(request.peer_emails))
        }
    )
    db.add(verification)
    db.commit()
    
    # TODO: Send emails to peers via Celery task
    # from app.tasks.verification import send_endorsement_requests
    # send_endorsement_requests.delay(verification.id, request.peer_emails)
    
    return {
        "success": True,
        "message": f"Endorsement requests sent to {len(request.peer_emails)} peers",
        "verification_id": str(verification.id)
    }
