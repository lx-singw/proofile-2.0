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

from pdfminer.high_level import extract_text
import mammoth
import shutil
import tempfile
import os
from app.services.ai_service import parse_resume_to_json
from app.services.profile_builder import UniversalProfileBuilder, DataSourceType
from app.schemas.profile import ProfileRead
from app.services import profile_cache

@router.post('/upload', status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(file: UploadFile = File(...), background_tasks: BackgroundTasks = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_active_user)):
    # 1. Save file to temporary storage for processing
    tmp_path = None
    extracted_text = ""
    
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        # 2. Extract Text based on extension
        filename_lower = file.filename.lower()
        if filename_lower.endswith('.pdf'):
            extracted_text = extract_text(tmp_path)
            
        elif filename_lower.endswith('.docx'):
            with open(tmp_path, "rb") as docx_file:
                result = mammoth.extract_raw_text(docx_file)
                extracted_text = result.value
                
        elif filename_lower.endswith('.txt'):
             with open(tmp_path, "r", encoding="utf-8") as txt_file:
                extracted_text = txt_file.read()
                
        # 3. Parse with AI
        # (If extraction failed or empty, we skip parsing but still save record)
        parsed_data = {}
        if extracted_text and len(extracted_text.strip()) > 50:
            try:
                parsed_data = await parse_resume_to_json(extracted_text)
            except Exception as e:
                print(f"AI Parsing failed: {e}")
                
        # 4. Ingest into Profile (Sync)
        if parsed_data:
             builder = UniversalProfileBuilder(db)
             profile = await builder.ingest_data(
                user_id=current_user.id,
                source=DataSourceType.RESUME_UPLOAD,
                data=parsed_data,
                confidence=0.9 # High confidence from Resume
             )
             # Update cache
             profile_read = ProfileRead.model_validate(profile)
             await profile_cache.set_profile(profile_read)

        # 5. Save Resume Record
        # We store the Parsed Data as the resume data for now
        resume = Resume(
            user_id=current_user.id, 
            name=(file.filename or "Uploaded Resume"), 
            data=parsed_data
        )
        db.add(resume)
        
        # Log activity
        from app.models.activity import Activity
        activity = Activity(
             user_id=current_user.id,
             action_type="resume_uploaded",
             description=f"Uploaded and synced resume: {resume.name}"
        )
        db.add(activity)
        
        await db.commit()
        await db.refresh(resume)
        
        return {"resume_id": str(resume.id), "status": "Resume uploaded and synced to profile successfully."}
        
    except Exception as e:
        # Clean up
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
        
    finally:
        # Clean up
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

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

@router.post("/{resume_id}/rewrite")
async def rewrite_resume_content(
    resume_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Rewrite specific content using AI.
    Payload: { "text": str, "enhancement_type": str, "context": str (optional) }
    """
    from app.services.ai_service import rewrite_content
    
    # Verify ownership
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    text = payload.get("text")
    enhancement_type = payload.get("enhancement_type", "professional")
    context = payload.get("context")
    
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text is required")
        
    try:
        result = await rewrite_content(text, enhancement_type, context)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/templates/list")
async def list_templates(
    current_user = Depends(get_current_active_user)
):
    """List available resume templates"""
    from app.services.template_service import get_all_templates
    return get_all_templates()

@router.post("/{resume_id}/template")
async def apply_template(
    resume_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Apply a template to a resume"""
    template_id = payload.get("template_id")
    if not template_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Template ID required")
        
    # Verify ownership
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    resume.template_id = template_id
    await db.commit()
    await db.refresh(resume)
    
    return resume

@router.post("/{resume_id}/versions")
async def create_version(
    resume_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new version snapshot"""
    from app.models.resume_version import ResumeVersion
    from sqlalchemy import func
    
    # Verify ownership
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    # Get next version number
    count_result = await db.execute(select(func.count()).select_from(ResumeVersion).where(ResumeVersion.resume_id == resume_id))
    version_number = count_result.scalar() + 1
    
    version = ResumeVersion(
        resume_id=resume_id,
        version_number=version_number,
        data=resume.data,
        description=payload.get("description", f"Version {version_number}"),
        created_by=current_user.id
    )
    db.add(version)
    await db.commit()
    return version

@router.get("/{resume_id}/versions")
async def list_versions(
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List all versions for a resume"""
    from app.models.resume_version import ResumeVersion
    
    # Verify ownership
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    result = await db.execute(select(ResumeVersion).where(ResumeVersion.resume_id == resume_id).order_by(ResumeVersion.version_number.desc()))
    return result.scalars().all()

@router.post("/{resume_id}/versions/{version_id}/restore")
async def restore_version(
    resume_id: UUID,
    version_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Restore a specific version"""
    from app.models.resume_version import ResumeVersion
    
    # Verify ownership
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    # Get version
    v_result = await db.execute(select(ResumeVersion).where(ResumeVersion.id == version_id, ResumeVersion.resume_id == resume_id))
    version = v_result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
        
    # Create backup of current state before restoring
    # (Optional, but good practice)
    
    # Restore data
    resume.data = version.data
    await db.commit()
    await db.refresh(resume)
    
    return resume