from typing import List, Dict, Any
from app.models.profile import Profile
from app.models.user import User

class SuggestionEngine:
    """
    Generates personalized "Next Step" suggestions to help users improve their profile completeness
    and value.
    """
    
    @staticmethod
    def get_suggestions(user: User, profile: Profile) -> List[Dict[str, Any]]:
        suggestions = []
        
        # Priority 1: Basics (Identity)
        if not user.full_name:
             suggestions.append({
                 "id": "add_name",
                 "title": "Add your name",
                 "description": "Recruiters need to know who you are.",
                 "impact": "+5%",
                 "action_link": "/profile/edit"
             })
             
        if not profile.headline:
            suggestions.append({
                "id": "add_headline",
                "title": "Add a professional headline",
                "description": "Summarize your role in one line (e.g. 'Senior Product Manager').",
                "impact": "+10%",
                "action_link": "/profile/edit"
            })
            
        if not profile.avatar_url:
            suggestions.append({
                "id": "add_photo",
                "title": "Add a profile photo",
                "description": "Profiles with photos get 14x more views.",
                "impact": "+10%",
                "action_link": "/profile/edit"
            })
            
        if not profile.summary:
            suggestions.append({
                "id": "add_summary",
                "title": "Write a summary",
                "description": "Tell your professional story in 2-3 sentences.",
                "impact": "+10%",
                "action_link": "/profile/edit"
            })
            
        # Priority 2: Core Data
        has_experience = profile.experience_data and len(profile.experience_data) > 0
        if not has_experience:
            suggestions.append({
                "id": "add_experience",
                "title": "Add work experience",
                "description": "List your past roles to showcase your career path.",
                "impact": "+30%",
                "action_link": "/profile/education" # Using existing route placeholder
            })
            
        has_skills = profile.skills_data and len(profile.skills_data) > 0
        if not has_skills:
             suggestions.append({
                "id": "add_skills",
                "title": "Add skills",
                "description": "Highlight your technical and soft skills.",
                "impact": "+20%",
                "action_link": "/profile/skills"
            })
            
        # Priority 3: Verification (The "Trust" Layer)
        # Assuming we can check verification status from user or profile relations (placeholder logic)
        is_email_verified = True # Placeholder: user.is_verified
        if not is_email_verified:
            suggestions.append({
                "id": "verify_email",
                "title": "Verify your email",
                "description": "Build trust by verifying your contact info.",
                "impact": "+10%",
                "action_link": "/verify"
            })
            
        # Limit to top 3 most impactful suggestions
        return suggestions[:3]
