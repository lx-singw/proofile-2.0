"""
Webhook Handlers
External service webhooks (Stripe, SendGrid)
"""

from app.api.v1.webhooks.stripe_identity import router as stripe_router
from app.api.v1.webhooks.sendgrid import router as sendgrid_router

__all__ = ["stripe_router", "sendgrid_router"]
