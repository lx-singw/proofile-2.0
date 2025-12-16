"""
Celery Tasks for Ratings/Reputation System

Async processing for:
- Reputation score recalculation
- Rating moderation
- Rating request email sending
"""

from app.celery_app import celery_app
from app.core.database import get_db_sync
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def recalculate_reputation(self, user_id: int):
    """
    Recalculate reputation stats for a user.
    Called after a new rating is submitted.
    
    Args:
        user_id: ID of user to recalculate
    """
    try:
        logger.info(f"Recalculating reputation for user {user_id}")
        
        from app.services.scoring.scoring_engine import update_user_reputation_stats
        
        db = get_db_sync()
        stats = update_user_reputation_stats(db, user_id)
        
        logger.info(f"User {user_id} reputation updated: {stats['global_score']}")
        return {"success": True, "user_id": user_id, "score": stats["global_score"]}
        
    except Exception as e:
        logger.error(f"Failed to recalculate reputation for user {user_id}: {str(e)}")
        try:
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            pass
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def send_rating_request_email(
    self,
    recipient_email: str,
    requester_name: str,
    company: str,
    relationship: str,
    magic_link: str
):
    """
    Send rating request invitation email.
    
    Args:
        recipient_email: Email of person being asked to rate
        requester_name: Name of person requesting the rating
        company: Company context
        relationship: Relationship type (manager, peer, etc.)
        magic_link: Unique link to submit rating
    """
    try:
        logger.info(f"Sending rating request email to {recipient_email}")
        
        from app.services.email_service import EmailService
        
        email_service = EmailService()
        
        subject = f"{requester_name} needs your input for their Proofile"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 40px 20px; }}
                .container {{ max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ text-align: center; margin-bottom: 24px; }}
                .logo-text {{ font-size: 24px; font-weight: 700; color: #4F46E5; }}
                h1 {{ font-size: 20px; color: #1f2937; margin: 0 0 16px; }}
                .context-box {{ background: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 8px; margin: 20px 0; }}
                .btn {{ display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                p {{ color: #6b7280; line-height: 1.6; margin: 0 0 16px; }}
                .note {{ font-size: 13px; color: #9ca3af; margin-top: 20px; }}
                .footer {{ text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <span class="logo-text">⭐ Proofile</span>
                </div>
                <h1>Hi there!</h1>
                <p><strong>{requester_name}</strong> has listed you as their <strong>{relationship}</strong> at <strong>{company}</strong>.</p>
                <p>They're building their verified professional reputation on Proofile and have asked for your feedback.</p>
                
                <div class="context-box">
                    <strong>Your input matters:</strong><br>
                    Your verified rating will help {requester_name} stand out to future employers.
                </div>
                
                <div style="text-align: center;">
                    <a href="{magic_link}" class="btn">Rate {requester_name} →</a>
                </div>
                
                <p class="note">⏱️ It takes less than 2 minutes. You can choose to remain anonymous to the public.</p>
                
                <div class="footer">
                    © 2024 Proofile · Building verified professional reputations
                </div>
            </div>
        </body>
        </html>
        """
        
        body = f"""
Hi!

{requester_name} has listed you as their {relationship} at {company}.

They're building their verified professional reputation on Proofile and have asked for your feedback.

Your verified rating will help {requester_name} stand out to future employers.

Rate {requester_name}: {magic_link}

It takes less than 2 minutes. You can choose to remain anonymous to the public.

- The Proofile Team
        """
        
        result = email_service.send_email(
            to_email=recipient_email,
            subject=subject,
            body=body.strip(),
            html_content=html_content
        )
        
        logger.info(f"Rating request email sent to {recipient_email}")
        return {"success": True, "email": recipient_email}
        
    except Exception as e:
        logger.error(f"Failed to send rating request email to {recipient_email}: {str(e)}")
        try:
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            pass
        return {"success": False, "error": str(e)}


@celery_app.task
def moderate_rating_content(rating_id: int, text_content: str):
    """
    Run AI moderation on rating text content.
    Checks for hate speech, PII, harassment.
    
    Args:
        rating_id: ID of the rating
        text_content: Text to moderate
    """
    try:
        logger.info(f"Moderating rating {rating_id}")
        
        # In production, this would call OpenAI moderation API
        # For now, do basic keyword filtering
        flagged_words = ["hate", "racist", "kill", "threat"]
        is_flagged = any(word in text_content.lower() for word in flagged_words)
        
        if is_flagged:
            # Update rating status to flagged
            from app.models.rating import Rating
            db = get_db_sync()
            rating = db.query(Rating).filter(Rating.id == rating_id).first()
            if rating:
                rating.status = "flagged"
                db.commit()
            
            logger.warning(f"Rating {rating_id} flagged for moderation")
            return {"success": True, "flagged": True, "rating_id": rating_id}
        
        return {"success": True, "flagged": False, "rating_id": rating_id}
        
    except Exception as e:
        logger.error(f"Failed to moderate rating {rating_id}: {str(e)}")
        return {"success": False, "error": str(e)}
