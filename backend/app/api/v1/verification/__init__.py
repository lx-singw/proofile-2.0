"""
Verification API v2 Routes
Identity, Skills, Employment, and Document verification endpoints
"""

from app.api.v1.verification.identity import router as identity_router
from app.api.v1.verification.skills import router as skills_router
from app.api.v1.verification.documents import router as documents_router
from app.api.v1.verification.employment import router as employment_router

__all__ = ["identity_router", "skills_router", "documents_router", "employment_router"]
