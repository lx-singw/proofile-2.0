from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.resume import Resume
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

    async def _fetch_uploaded_resumes_data(self) -> List[Dict[str, Any]]:
        """
        Fetches data from previously uploaded/analyzed resumes.
        """
        result = await self.db.execute(
            select(Resume)
            .where(Resume.user_id == self.user_id)
            .order_by(Resume.updated_at.desc())
            .limit(3)
        )
        resumes = result.scalars().all()
        
        aggregated_work = []
        aggregated_education = []
        aggregated_skills = []
        
        for resume in resumes:
            # Assuming resume.analysis_results contains parsed data
            # If not, we'd need to parse the file_path here
            if resume.analysis_results:
                data = resume.analysis_results
                if "work_experience" in data:
                    aggregated_work.extend(data["work_experience"])
                if "education" in data:
                    aggregated_education.extend(data["education"])
                if "skills" in data:
                    aggregated_skills.extend(data["skills"])
                    
        return {
            "work_experience": aggregated_work,
            "education": aggregated_education,
            "skills": list(set(aggregated_skills)) # Deduplicate simple strings
        }
