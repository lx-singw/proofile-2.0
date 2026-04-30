import logging
from typing import Optional, Dict, Any

import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Stripe from centralised settings
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_onboarding_link(self, user: User, return_url: str, refresh_url: str) -> str:
        """
        Create a Stripe Connect onboarding link for a user (Recruiter/Seller).
        Stripe SDK calls are synchronous so we await the DB operations separately.
        """
        if not user.stripe_account_id:
            # Create a new Express account for the user
            account = stripe.Account.create(
                type="express",
                country="ZA",  # Defaulting to South Africa as per codebase context
                email=user.email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            user.stripe_account_id = account.id
            self.db.add(user)
            await self.db.commit()

        # Create the account link
        account_link = stripe.AccountLink.create(
            account=user.stripe_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        return account_link.url

    async def check_onboarding_status(self, user: User) -> bool:
        """
        Check if the user has completed Stripe onboarding.
        """
        if not user.stripe_account_id:
            return False
            
        account = stripe.Account.retrieve(user.stripe_account_id)
        is_onboarded = account.details_submitted
        
        if is_onboarded != user.is_stripe_onboarded:
            user.is_stripe_onboarded = is_onboarded
            self.db.add(user)
            await self.db.commit()
            
        return is_onboarded

    async def initiate_paid_inbox_session(
        self, 
        sender: User, 
        recipient: User, 
        amount: float,
        success_url: str,
        cancel_url: str,
        message_metadata: Dict[str, Any]
    ) -> str:
        """
        Initiate a Stripe Checkout session for a Paid Inbox message.
        """
        if not recipient.stripe_account_id or not recipient.is_stripe_onboarded:
            raise ValueError("Recipient has not onboarded for payments")

        # Calculate fees (20% platform fee)
        platform_fee_percent = 0.20
        platform_fee_amount = int(amount * platform_fee_percent * 100)  # Stripe uses cents
        recipient_amount = int(amount * 100) - platform_fee_amount

        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "zar",
                    "product_data": {
                        "name": f"Paid Message to {recipient.full_name or recipient.username}",
                        "description": "Recruiter message priority delivery",
                    },
                    "unit_amount": int(amount * 100),
                },
                "quantity": 1,
            }],
            payment_intent_data={
                "application_fee_amount": platform_fee_amount,
                "transfer_data": {
                    "destination": recipient.stripe_account_id,
                },
                "metadata": {
                    "sender_id": str(sender.id),
                    "recipient_id": str(recipient.id),
                    "payment_type": PaymentType.PAID_INBOX.value,
                }
            },
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "sender_id": str(sender.id),
                "recipient_id": str(recipient.id),
                **message_metadata
            }
        )

        # Create local payment record
        payment = Payment(
            user_id=sender.id,
            recipient_id=recipient.id,
            amount=amount,
            currency="ZAR",
            stripe_session_id=session.id,
            status=PaymentStatus.PENDING.value,
            payment_type=PaymentType.PAID_INBOX.value,
            platform_fee=amount * platform_fee_percent,
            recipient_earnings=amount * (1 - platform_fee_percent),
            metadata_json=message_metadata
        )
        self.db.add(payment)
        await self.db.commit()

        return session.url

    async def handle_webhook_event(self, payload: str, sig_header: str):
        """
        Handle Stripe webhooks for payment updates.
        """
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET
        event = None

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError as e:
            raise e
        except stripe.error.SignatureVerificationError as e:
            raise e

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            await self._finalize_payment(session.id)
        
        return True

    async def _finalize_payment(self, session_id: str):
        result = await self.db.execute(
            select(Payment).where(Payment.stripe_session_id == session_id)
        )
        payment = result.scalars().first()
        if payment:
            payment.status = PaymentStatus.COMPLETED.value
            self.db.add(payment)
            await self.db.commit()
            
            # TODO: Trigger notification or unlock message here
            logger.info("Payment %s finalized for session %s", payment.id, session_id)
