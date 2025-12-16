"""
SendGrid Email Service

Handles sending transactional emails for verification system:
- OTP verification codes
- Peer verification requests
- Welcome and notification emails
"""

import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# SendGrid SDK - install with: pip install sendgrid
try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content, Personalization
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    logger.warning("SendGrid SDK not installed. Email sending will be mocked.")


class EmailService:
    """Email service using SendGrid API."""
    
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@proofile.com")
        self.from_name = os.getenv("SENDGRID_FROM_NAME", "Proofile")
        
        if SENDGRID_AVAILABLE and self.api_key:
            self.client = SendGridAPIClient(self.api_key)
        else:
            self.client = None
            if not self.api_key:
                logger.warning("SENDGRID_API_KEY not configured. Email sending will be mocked.")
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        template: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None,
        html_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an email using SendGrid.
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            body: Plain text body
            template: Optional template ID for dynamic templates
            template_data: Data to populate template
            html_content: Optional HTML body
            
        Returns:
            Dict with success status and metadata
        """
        if not self.client:
            # Mock send for development
            logger.info(f"[MOCK] Email sent to {to_email}")
            logger.info(f"[MOCK] Subject: {subject}")
            logger.info(f"[MOCK] Body: {body[:100]}...")
            return {
                "success": True,
                "mock": True,
                "to": to_email,
                "subject": subject
            }
        
        try:
            message = Mail(
                from_email=Email(self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                plain_text_content=Content("text/plain", body)
            )
            
            if html_content:
                message.add_content(Content("text/html", html_content))
            
            # Use dynamic template if provided
            if template and template_data:
                message.template_id = template
                personalization = Personalization()
                personalization.add_to(To(to_email))
                for key, value in template_data.items():
                    personalization.dynamic_template_data[key] = value
                message.add_personalization(personalization)
            
            response = self.client.send(message)
            
            logger.info(f"Email sent to {to_email}, status: {response.status_code}")
            
            return {
                "success": response.status_code in [200, 201, 202],
                "status_code": response.status_code,
                "to": to_email,
                "message_id": response.headers.get("X-Message-Id")
            }
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "to": to_email
            }
    
    def send_otp_email(self, to_email: str, otp_code: str, company_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Send OTP verification email.
        
        Args:
            to_email: Recipient email
            otp_code: The 6-digit OTP code
            company_name: Optional company name for context
        """
        context = f" for {company_name}" if company_name else ""
        
        subject = f"Your Proofile Verification Code"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 40px 20px; }}
                .container {{ max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ text-align: center; margin-bottom: 24px; }}
                .logo-text {{ font-size: 24px; font-weight: 700; color: #4F46E5; }}
                h1 {{ font-size: 20px; color: #1f2937; margin: 0 0 16px; text-align: center; }}
                .otp-box {{ background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0; font-weight: 700; }}
                p {{ color: #6b7280; line-height: 1.6; margin: 0 0 16px; }}
                .context {{ background: #f9fafb; padding: 12px 16px; border-radius: 8px; font-size: 14px; color: #374151; margin: 16px 0; }}
                .footer {{ text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <span class="logo-text">🔐 Proofile</span>
                </div>
                <h1>Your Verification Code</h1>
                <p>Use this code to verify your employment{context}:</p>
                <div class="otp-box">{otp_code}</div>
                <div class="context">
                    ⏰ This code expires in <strong>10 minutes</strong><br>
                    🔒 Never share this code with anyone
                </div>
                <p>If you didn't request this code, you can safely ignore this email.</p>
                <div class="footer">
                    © 2024 Proofile · Building verified professional identities
                </div>
            </div>
        </body>
        </html>
        """
        
        body = f"""
Your Proofile Verification Code

Use this code to verify your employment{context}:

{otp_code}

This code expires in 10 minutes. Never share this code with anyone.

If you didn't request this code, you can safely ignore this email.

- The Proofile Team
        """
        
        return self.send_email(
            to_email=to_email,
            subject=subject,
            body=body.strip(),
            html_content=html_content
        )
    
    def send_peer_verification_request(
        self,
        to_email: str,
        requester_name: str,
        skill_name: str,
        verification_link: str
    ) -> Dict[str, Any]:
        """
        Send peer verification request email.
        
        Args:
            to_email: Peer's email
            requester_name: Name of person requesting verification
            skill_name: Skill being verified
            verification_link: Unique link for peer to submit verification
        """
        subject = f"{requester_name} wants you to verify their {skill_name} skills"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 40px 20px; }}
                .container {{ max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ text-align: center; margin-bottom: 24px; }}
                .logo-text {{ font-size: 24px; font-weight: 700; color: #4F46E5; }}
                h1 {{ font-size: 20px; color: #1f2937; margin: 0 0 8px; }}
                .subtitle {{ color: #6b7280; margin: 0 0 24px; }}
                .info-box {{ background: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 8px; margin: 20px 0; }}
                .info-box strong {{ color: #166534; }}
                .btn {{ display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                p {{ color: #6b7280; line-height: 1.6; margin: 0 0 16px; }}
                .footer {{ text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <span class="logo-text">✨ Proofile</span>
                </div>
                <h1>Verification Request</h1>
                <p class="subtitle">{requester_name} has asked you to verify their skills</p>
                
                <div class="info-box">
                    <strong>Skill:</strong> {skill_name}<br>
                    <strong>Requested by:</strong> {requester_name}
                </div>
                
                <p>Click the button below to provide your endorsement. Your feedback helps build trust and credibility.</p>
                
                <div style="text-align: center;">
                    <a href="{verification_link}" class="btn">Verify Skills →</a>
                </div>
                
                <p style="font-size: 13px; color: #9ca3af;">This link expires in 7 days. If you don't recognize this request, you can safely ignore it.</p>
                
                <div class="footer">
                    © 2024 Proofile · Building verified professional identities
                </div>
            </div>
        </body>
        </html>
        """
        
        body = f"""
Verification Request from {requester_name}

{requester_name} has listed you as a colleague who can verify their {skill_name} skills.

Click the link below to provide your endorsement:
{verification_link}

This link expires in 7 days.

If you don't recognize this request, you can safely ignore this email.

- The Proofile Team
        """
        
        return self.send_email(
            to_email=to_email,
            subject=subject,
            body=body.strip(),
            html_content=html_content
        )


# Create singleton instance
email_service = EmailService()
