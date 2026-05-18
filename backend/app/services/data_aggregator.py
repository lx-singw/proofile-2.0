from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from typing import Dict, Any, List

class DataAggregator:
    def __init__(self, db: AsyncSession, user_id: Any):
        self.db = db
        self.user_id = user_id

    async def aggregate_data(self) -> Dict[str, Any]:
        """
        Aggregates data from User profile, uploaded resumes, and other sources.
        """
        user_data = await self._fetch_user_profile()
        uploaded_resumes_data = await self._fetch_uploaded_resumes_data()
        
        # In a real implementation, we would also fetch LinkedIn data here
        
        return {
            "profile": user_data,
            "uploaded_resumes": uploaded_resumes_data,
            "source_count": 1 + len(uploaded_resumes_data)
        }

    async def _fetch_user_profile(self) -> Dict[str, Any]:
        result = await self.db.execute(select(User).where(User.id == self.user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            return {}
            
        return {
            "full_name": user.full_name,
            "email": user.email,
            # In a real app, User model would have more fields like phone, location, etc.
            "location": "Remote", 
            "phone": "+1 (555) 000-0000"
        }

    async def _fetch_uploaded_resumes_data(self) -> Dict[str, Any]:
        """
        Fetches data from previously uploaded/analyzed resumes.
        Note: Resume functionality has been removed.
        """
        return {
            "work_experience": [],
            "education": [],
            "skills": []
        }
