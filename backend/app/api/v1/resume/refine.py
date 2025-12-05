
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.resume import Resume
from sqlalchemy.future import select
from app.services.ai_service import refine_resume_with_ai
import asyncio
from typing import Optional

router = APIRouter()


@router.post("/{resume_id}/refine")
async def refine_resume(
    resume_id: str,
    action: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    # Fetch resume from DB
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume: Resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume_text = ""
    # Try to extract text from resume.data (assume 'raw_text' or 'sections' key)
    if isinstance(resume.data, dict):
        resume_text = resume.data.get("raw_text") or ""
        if not resume_text and "sections" in resume.data:
            resume_text = "\n".join(str(v) for v in resume.data["sections"].values())
    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text not available for refinement")
    # Call AI service
    try:
        ai_result = await refine_resume_with_ai(resume_text, action)
        improvements = ai_result.get("choices", [{}])[0].get("message", {}).get("content", "")
        return JSONResponse({
            "resume_id": resume_id,
            "action": action,
            "status": "Refinement applied (AI)",
            "improvements": improvements,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI refinement failed: {e}")
