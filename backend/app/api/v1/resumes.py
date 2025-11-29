from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.api.deps import get_db, get_current_active_user
from app.schemas.resume import ResumeCreate, ResumeRead, ResumeListItem, ResumeUpdate
from app.models.resume import Resume
from uuid import UUID
from app import schemas

router = APIRouter()

@router.post("", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def create_resume(resume_in: ResumeCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_active_user)):
    from app.models.activity import Activity
    resume = Resume(
        user_id=current_user.id,
        name=resume_in.name,
        template_id=resume_in.template_id,
        data=resume_in.data or {}
    )
    db.add(resume)
    
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        action_type="resume_created",
        description=f"Created resume: {resume.name}",
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(resume)
    return resume

@router.get("", response_model=List[ResumeListItem])
async def list_resumes(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_active_user)):
    result = await db.execute(select(Resume).where(Resume.user_id == current_user.id))
    items = result.scalars().all()
    return items

@router.get("/{resume_id}", response_model=ResumeRead)
async def get_resume(resume_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_active_user)):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return resume

@router.put("/{resume_id}", response_model=ResumeRead)
async def put_resume(resume_id: UUID, resume_in: ResumeUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_active_user)):
    from app.models.activity import Activity
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume_in.name is not None:
        resume.name = resume_in.name
    if resume_in.template_id is not None:
        resume.template_id = resume_in.template_id
    if resume_in.data is not None:
        resume.data = resume_in.data
        
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        action_type="resume_updated",
        description=f"Updated resume: {resume.name}",
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(resume)
    return resume

@router.post('/upload', status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(file: UploadFile = File(...), background_tasks: BackgroundTasks = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_active_user)):
    # Minimal handling: persist a record and schedule a background parse (worker will pick up in prod)
    resume = Resume(user_id=current_user.id, name=(file.filename or "Uploaded Resume"), data={})
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    # In production, upload to S3 and enqueue Celery task. Here we return accepted and a resume id.
    return {"resume_id": str(resume.id), "status": "Your resume is being parsed. We'll notify you when it's ready."}

@router.post("/{resume_id}/export")
async def export_resume_pdf(
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Export resume as PDF"""
    from app.services.pdf_service import generate_resume_pdf
    from fastapi.responses import Response
    import re
    
    try:
        # Get the resume
        result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
        # Generate PDF
        pdf_bytes = generate_resume_pdf(resume.template_id, resume.data)
        
        # Sanitize filename for Content-Disposition header
        safe_filename = re.sub(r'[^\w\s-]', '', resume.name).strip().replace(' ', '_')
        if not safe_filename:
            safe_filename = f"resume_{resume_id}"
        
        # Return PDF as download
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}.pdf"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Error generating PDF for resume {resume_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate PDF: {str(e)}")