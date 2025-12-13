from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

from app.models.profile import Profile, ProfileState
from app.models.profile_data_source import ProfileDataSource, DataSourceType
from app.models.user import User

logger = logging.getLogger(__name__)

class UniversalProfileBuilder:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ingest_data(self, user_id: int, source: DataSourceType, data: Dict[str, Any], confidence: float = 1.0) -> Profile:
        """
        Main entry point for ingesting data from any source into the profile.
        """
        # 1. Record the raw data source
        await self._record_data_source(user_id, source, data, confidence)
        
        # 2. Get or create the profile
        profile = await self._get_or_create_profile(user_id)
        
        # 3. Merge data into the profile (Logic only, sync)
        self._merge_data(profile, data, source, confidence)
        
        # 4. Recalculate completeness and state
        await self._update_completeness(profile)
        
        await self.db.commit()
        await self.db.refresh(profile)
        
        return profile

    async def _record_data_source(self, user_id: int, source: DataSourceType, data: Dict[str, Any], confidence: float):
        data_source = ProfileDataSource(
            user_id=user_id,
            source=source.value,
            data=data,
            confidence=confidence
        )
        self.db.add(data_source)
        # Flush to get ID, but don't commit yet to keep atomic with profile update
        await self.db.flush()

    async def _get_or_create_profile(self, user_id: int) -> Profile:
        result = await self.db.execute(select(Profile).filter(Profile.user_id == user_id))
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = Profile(user_id=user_id, state=ProfileState.EMBRYO.value)
            self.db.add(profile)
            await self.db.flush()
        return profile

    def _merge_data(self, profile: Profile, data: Dict[str, Any], source: DataSourceType, confidence: float):
        """
        Intelligent merging logic. Pure python logic, no DB calls.
        """
        # 1. Update basic fields if provided and not existing or higher confidence
        if "headline" in data and (not profile.headline or confidence >= 0.8):
            profile.headline = data["headline"]
        
        if "summary" in data and (not profile.summary or confidence >= 0.8):
            profile.summary = data["summary"]
            
        if "avatar_url" in data:
            profile.avatar_url = data["avatar_url"]

        # 2. Append/Merge Lists (Skills, Experience, Education)
        if "skills" in data and isinstance(data["skills"], list):
            current_skills = profile.skills_data or []
            new_skills = [s for s in data["skills"] if s not in current_skills]
            if new_skills:
                profile.skills_data = current_skills + new_skills

        if "experience" in data and isinstance(data["experience"], list):
            # Use smart merging to prevent duplicates
            current_exp = profile.experience_data or []
            profile.experience_data = self._merge_experience(current_exp, data["experience"], source)
                 
        if "education" in data and isinstance(data["education"], list):
             current_edu = profile.education_data or []
             profile.education_data = self._merge_education(current_edu, data["education"], source)

    def _merge_experience(self, current: List[Dict], new_items: List[Dict], source: DataSourceType) -> List[Dict]:
        """
        Merge experience items, avoiding duplicates via fuzzy matching.
        """
        merged = list(current)
        
        for item in new_items:
            match_index = self._find_experience_match(merged, item)
            
            if match_index is not None:
                merged[match_index].update(item)
            else:
                merged.append(item)
                
        return merged

    def _merge_education(self, current: List[Dict], new_items: List[Dict], source: DataSourceType) -> List[Dict]:
        """
        Merge education items, avoiding duplicates.
        """
        merged = list(current)
        
        for item in new_items:
            match_index = self._find_education_match(merged, item)
            
            if match_index is not None:
                merged[match_index].update(item)
            else:
                merged.append(item)
                
        return merged

    def _find_experience_match(self, current_list: List[Dict], new_item: Dict) -> Optional[int]:
        from difflib import SequenceMatcher
        
        for i, existing in enumerate(current_list):
            company1 = (existing.get("company") or "").lower().strip()
            company2 = (new_item.get("company") or "").lower().strip()
            
            title1 = (existing.get("title") or "").lower().strip()
            title2 = (new_item.get("title") or "").lower().strip()
            
            company_match = company1 == company2
            title_match = title1 == title2
            
            if not company_match and company1 and company2:
                ratio = SequenceMatcher(None, company1, company2).ratio()
                is_substring = (company1 in company2 or company2 in company1) and len(company1)>3 and len(company2)>3
                company_match = ratio > 0.75 or is_substring
                
            if not title_match and title1 and title2:
                ratio = SequenceMatcher(None, title1, title2).ratio()
                title_match = ratio > 0.85
            
            if company_match and title_match:
                return i
        return None

    def _find_education_match(self, current_list: List[Dict], new_item: Dict) -> Optional[int]:
        from difflib import SequenceMatcher
        
        for i, existing in enumerate(current_list):
            school1 = (existing.get("school") or existing.get("institution") or "").lower().strip()
            school2 = (new_item.get("school") or new_item.get("institution") or "").lower().strip()
            
            degree1 = (existing.get("degree") or "").lower().strip()
            degree2 = (new_item.get("degree") or "").lower().strip()
            
            school_match = school1 == school2
            if not school_match and school1 and school2:
                ratio = SequenceMatcher(None, school1, school2).ratio()
                is_substring = (school1 in school2 or school2 in school1) and len(school1)>3 and len(school2)>3
                school_match = ratio > 0.75 or is_substring
                
            degree_match = degree1 == degree2
            if not degree_match and degree1 and degree2:
                degree_match = SequenceMatcher(None, degree1, degree2).ratio() > 0.85
                
            if school_match and degree_match:
                return i
        return None

    async def _update_completeness(self, profile: Profile):
        """
        Calculate profile completeness score (0-100) and update state.
        Includes Trust Points from verifications.
        """
        score = 0
        breakdown = {
            "basics": 0,
            "experience": 0,
            "education": 0,
            "skills": 0,
            "trust": 0
        }
        
        # Basics (Headline, Summary, Avatar) - 20%
        if profile.headline: breakdown["basics"] += 7
        if profile.summary: breakdown["basics"] += 7
        if profile.avatar_url: breakdown["basics"] += 6
        
        # Experience - 25%
        if profile.experience_data and len(profile.experience_data) > 0:
            breakdown["experience"] = 25
            
        # Education - 20%
        if profile.education_data and len(profile.education_data) > 0:
            breakdown["education"] = 20
            
        # Skills - 15%
        if profile.skills_data and len(profile.skills_data) > 0:
            breakdown["skills"] = 15
            
        # Trust - 20%
        from app.models.verification import Verification
        result = await self.db.execute(
            select(Verification).filter(
                Verification.user_id == profile.user_id,
                Verification.status == "verified"
            )
        )
        verifications = result.scalars().all()
        
        verified_types = [v.verification_type for v in verifications]
        
        if "email" in verified_types: breakdown["trust"] += 5
        if "phone" in verified_types: breakdown["trust"] += 5
        if "work_email" in verified_types: breakdown["trust"] += 10
        
        breakdown["trust"] = min(breakdown["trust"], 20)
            
        score = sum(breakdown.values())
        profile.completeness_score = float(score)
        profile.completeness_data = breakdown
        
        if score < 30:
            profile.state = ProfileState.EMBRYO.value
        elif score < 70:
            profile.state = ProfileState.GROWING.value
        elif score < 90:
            profile.state = ProfileState.MATURE.value
