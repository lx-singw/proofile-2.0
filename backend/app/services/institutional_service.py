from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.models.user import User
from app.models.verification import Verification
from app.models.trust_event import TrustEvent
import uuid

class InstitutionalService:
    def __init__(self, db: Session):
        self.db = db

    async def issue_gold_badge(
        self, 
        user_id: int, 
        verification_type: str, 
        institution_name: str, 
        verified_value: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Verification:
        """
        Issue a 'Gold-Standard' badge to a user. This represents a direct-to-source
        verification from a trusted institution.
        """
        # Close any existing verifications of this type to avoid duplicates
        self.db.query(Verification).filter(
            Verification.user_id == user_id,
            Verification.verification_type == verification_type,
            Verification.status == "verified"
        ).update({"status": "expired"})

        # Create the new Gold verification
        verification = Verification(
            user_id=user_id,
            verification_type=verification_type,
            status="verified",
            verification_provider=institution_name,
            verified_value=verified_value,
            verified_at=datetime.utcnow(),
            is_gold_standard=True,
            trust_level="GOLD",
            trust_points=50, # Massive trust boost for gold source
            verification_reference=f"GOLD-{uuid.uuid4().hex[:8].upper()}",
            verification_data=str(metadata) if metadata else None
        )
        
        self.db.add(verification)
        
        # Log Trust Event
        trust_event = TrustEvent(
            user_id=user_id,
            event_type="institutional_verification",
            points_change=50,
            description=f"Institutional Gold Badge issued by {institution_name} for {verification_type}",
            reference_id=verification.verification_reference
        )
        self.db.add(trust_event)
        
        # Update user's global trust score
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.trust_score = min(100, user.trust_score + 50)
            self.db.add(user)

        self.db.commit()
        self.db.refresh(verification)
        return verification

    async def simulate_hris_sync(self, user_id: int, hris_name: str = "Workday") -> List[Verification]:
        """
        Simulate a sync with an HRIS system like Workday or Rippling.
        This would normally be an API bridge.
        """
        # In a real app, this would query an external API
        # We simulate finding employment and seniority data
        results = []
        
        # 1. Employment Verification
        v1 = await self.issue_gold_badge(
            user_id=user_id,
            verification_type="employment",
            institution_name=hris_name,
            verified_value="Confirmed Active Employment",
            metadata={"seniority": "Senior", "department": "Engineering"}
        )
        results.append(v1)
        
        # 2. Skill Verification (from performance reviews)
        v2 = await self.issue_gold_badge(
            user_id=user_id,
            verification_type="skills",
            institution_name=hris_name,
            verified_value="Architecture, Node.js, Python",
            metadata={"source": "Performance Review 2024"}
        )
        results.append(v2)
        
        return results
