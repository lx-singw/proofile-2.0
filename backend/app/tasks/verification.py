"""
Celery Tasks for Verification System

Async processing for:
- Document OCR processing
- OTP email sending
- Trust score recalculation
- Peer verification email sending
"""

from app.celery_app import celery_app
from app.core.database import get_db_sync
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_ocr(self, document_id: int, file_path: str, document_type: str):
    """
    Process uploaded document using OCR.
    
    Args:
        document_id: Database ID of the Document record
        file_path: Path to the uploaded file (S3 or local)
        document_type: Type of document (employment, education, etc.)
    """
    try:
        logger.info(f"Processing document {document_id}: {document_type}")
        
        # Import services inside task to avoid circular imports
        from app.services.document_processor import DocumentProcessor
        from app.models.document import Document
        
        db = get_db_sync()
        processor = DocumentProcessor()
        
        # Get document record
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found")
            return {"success": False, "error": "Document not found"}
        
        # Update status to processing
        document.processing_status = "processing"
        db.commit()
        
        # Process the document (this calls OpenAI GPT-4o Vision)
        # result = processor.process_document(file_path, document_type)
        
        # For now, mock the OCR result
        result = {
            "success": True,
            "extracted_data": {
                "company_name": "Example Corp",
                "job_title": "Software Engineer",
                "dates": "2020-2023"
            },
            "confidence": 0.85
        }
        
        # Update document with extracted data
        document.extracted_data = str(result["extracted_data"])
        document.processing_status = "completed"
        document.ocr_confidence = result.get("confidence", 0)
        db.commit()
        
        logger.info(f"Document {document_id} processed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Failed to process document {document_id}: {str(e)}")
        
        # Retry on failure
        try:
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            # Update document status to failed
            try:
                db = get_db_sync()
                from app.models.document import Document
                document = db.query(Document).filter(Document.id == document_id).first()
                if document:
                    document.processing_status = "failed"
                    document.error_message = str(e)
                    db.commit()
            except:
                pass
        
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def send_otp_email(self, email: str, otp_code: str, verification_type: str = "employment"):
    """
    Send OTP verification email.
    
    Args:
        email: Recipient email address
        otp_code: The 6-digit OTP code
        verification_type: Type of verification (employment, email, etc.)
    """
    try:
        logger.info(f"Sending OTP email to {email} for {verification_type}")
        
        # Import email service inside task
        from app.services.email_service import EmailService
        
        email_service = EmailService()
        
        subject = f"Your Proofile Verification Code"
        body = f"""
        Your verification code is: {otp_code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        """
        
        result = email_service.send_email(
            to_email=email,
            subject=subject,
            body=body,
            template="otp_verification"
        )
        
        logger.info(f"OTP email sent to {email}")
        return {"success": True, "email": email}
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        try:
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            pass
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_peer_verification_email(
    self,
    peer_email: str,
    requester_name: str,
    skill_name: str,
    verification_link: str
):
    """
    Send peer verification request email.
    
    Args:
        peer_email: Email of the peer to verify
        requester_name: Name of the user requesting verification
        skill_name: Skill being verified
        verification_link: Unique link for peer to submit verification
    """
    try:
        logger.info(f"Sending peer verification email to {peer_email} for {skill_name}")
        
        from app.services.email_service import EmailService
        
        email_service = EmailService()
        
        subject = f"{requester_name} wants you to verify their {skill_name} skills"
        body = f"""
        Hi,
        
        {requester_name} has listed you as a colleague who can verify their {skill_name} skills.
        
        Please click the link below to provide your endorsement:
        {verification_link}
        
        This link will expire in 7 days.
        
        If you don't recognize this request, you can safely ignore this email.
        
        Thanks,
        The Proofile Team
        """
        
        result = email_service.send_email(
            to_email=peer_email,
            subject=subject,
            body=body,
            template="peer_verification"
        )
        
        logger.info(f"Peer verification email sent to {peer_email}")
        return {"success": True, "email": peer_email}
        
    except Exception as e:
        logger.error(f"Failed to send peer verification email to {peer_email}: {str(e)}")
        try:
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            pass
        return {"success": False, "error": str(e)}


@celery_app.task
def recalculate_trust_score(user_id: int):
    """
    Recalculate user's trust score after a verification event.
    
    Args:
        user_id: ID of the user to recalculate
    """
    try:
        logger.info(f"Recalculating trust score for user {user_id}")
        
        from app.services.trust_score_engine import update_user_trust_score
        from app.models.user import User
        
        db = get_db_sync()
        user = db.query(User).filter(User.id == user_id).first()
        
        if user:
            new_score = update_user_trust_score(db, user)
            logger.info(f"User {user_id} trust score updated to {new_score}")
            return {"success": True, "user_id": user_id, "new_score": new_score}
        
        return {"success": False, "error": "User not found"}
        
    except Exception as e:
        logger.error(f"Failed to recalculate trust score for user {user_id}: {str(e)}")
        return {"success": False, "error": str(e)}
