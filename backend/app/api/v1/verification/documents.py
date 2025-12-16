"""
Document Verification API Routes
Handles secure document upload and OCR processing
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import os

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.verification import Verification

router = APIRouter(prefix="/documents", tags=["document-verification"])


class DocumentUploadResponse(BaseModel):
    """Response after document upload"""
    document_id: str
    status: str  # processing, complete, failed
    message: str


class DocumentStatusResponse(BaseModel):
    """Status of document processing"""
    document_id: str
    status: str
    extracted_data: Optional[dict] = None
    match_score: Optional[float] = None
    error: Optional[str] = None


ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    target_type: str = Form(...),  # employment, education
    target_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document for verification.
    Accepted: Paystubs, Offer Letters, Transcripts, Certificates
    """
    # Validate file type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Accepted: JPG, PNG, WebP, PDF"
        )
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )
    
    # Validate target type
    if target_type not in ["employment", "education"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target type"
        )
    
    # Generate document ID
    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    
    # Create verification record
    verification = Verification(
        user_id=current_user.id,
        target_id=uuid.UUID(target_id) if target_id else None,
        target_type=target_type,
        method="document_ocr",
        status="pending",
        provider_id=document_id,
        metadata={
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(file_content),
            "uploaded_at": datetime.utcnow().isoformat(),
            "processing_status": "queued"
        }
    )
    db.add(verification)
    db.commit()
    
    # Queue document for processing
    try:
        from app.services.document_processor import queue_document_processing
        await queue_document_processing(
            document_id=document_id,
            file_content=file_content,
            content_type=file.content_type,
            user_id=current_user.id,
            target_type=target_type,
            target_id=target_id
        )
    except ImportError:
        # Mock processing for development
        verification.metadata["processing_status"] = "processing"
        db.commit()
    
    return DocumentUploadResponse(
        document_id=document_id,
        status="processing",
        message="Document uploaded successfully. Processing will take ~30 seconds."
    )


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check the processing status of an uploaded document"""
    verification = db.query(Verification).filter(
        Verification.provider_id == document_id,
        Verification.user_id == current_user.id,
        Verification.method == "document_ocr"
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    extracted = verification.metadata.get("extracted_data")
    match_score = verification.metadata.get("match_score")
    error = verification.metadata.get("error")
    
    # Map internal status to response status
    if verification.status == "verified":
        status_str = "complete"
    elif verification.status == "rejected":
        status_str = "failed"
    else:
        status_str = verification.metadata.get("processing_status", "processing")
    
    return DocumentStatusResponse(
        document_id=document_id,
        status=status_str,
        extracted_data=extracted,
        match_score=match_score,
        error=error
    )


@router.post("/{document_id}/confirm")
async def confirm_document_match(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Confirm the extracted data matches and complete verification"""
    verification = db.query(Verification).filter(
        Verification.provider_id == document_id,
        Verification.user_id == current_user.id,
        Verification.method == "document_ocr"
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if verification.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document already processed"
        )
    
    match_score = verification.metadata.get("match_score", 0)
    if match_score < 0.85:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match score too low for automatic approval"
        )
    
    verification.status = "verified"
    verification.verified_at = datetime.utcnow()
    
    # Update trust score
    from app.services.trust_score_engine import update_trust_score
    await update_trust_score(current_user.id, "document_verified", db)
    
    db.commit()
    
    return {"success": True, "message": "Document verified successfully"}


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an uploaded document and its verification record"""
    verification = db.query(Verification).filter(
        Verification.provider_id == document_id,
        Verification.user_id == current_user.id,
        Verification.method == "document_ocr"
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete from S3 if exists
    # from app.services.document_processor import delete_document_from_storage
    # await delete_document_from_storage(document_id)
    
    db.delete(verification)
    db.commit()
    
    return {"success": True, "message": "Document deleted"}
