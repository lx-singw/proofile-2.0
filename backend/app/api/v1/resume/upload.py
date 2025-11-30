from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    # Validate file or text
    if not file and not text:
        raise HTTPException(status_code=400, detail="No resume provided.")
    # TODO: Save file, parse, and trigger analysis
    # For now, simulate response
    return JSONResponse({
        "status": "success",
        "resume_id": 1,
        "message": "Resume uploaded and queued for analysis."
    })
