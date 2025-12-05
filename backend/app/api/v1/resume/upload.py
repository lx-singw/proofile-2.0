import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from sqlalchemy.orm import Session
from app.api import deps
from app.models.resume import Resume
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_resume(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    # Validate file or text
    if not file and not text:
        raise HTTPException(status_code=400, detail="No resume provided.")

    resume_id = uuid.uuid4()
    file_path = None
    
    if file:
        # Save file
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{resume_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        resume_name = file.filename
    else:
        # Handle text input (save as .txt)
        filename = f"{resume_id}.txt"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(text)
        resume_name = "Text Resume"

    # Create Resume record
    db_resume = Resume(
        id=resume_id,
        user_id=current_user.id,
        name=resume_name,
        file_path=file_path,
        status="uploaded",
        data={} # Initialize empty data
    )
    
    db.add(db_resume)
    await db.commit()
    await db.refresh(db_resume)

    return JSONResponse({
        "status": "success",
        "resume_id": str(db_resume.id),
        "message": "Resume uploaded successfully."
    })
