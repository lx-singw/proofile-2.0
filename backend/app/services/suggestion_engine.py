from typing import List, Dict, Any
from app.models.profile import Profile
from app.models.user import User

class SuggestionEngine:
    """
    Generates personalized "Next Step" suggestions to help users improve their profile completeness
    and value. Suggestions are prioritized based on user's opportunity_preference:
    
    Jobs Users: Work history → Skills → Peer ratings → Certifications → Education
    Training Users: Education → Certifications → Portfolio → References → Projects
    """
    
    @staticmethod
    def get_suggestions(user: User, profile: Profile) -> List[Dict[str, Any]]:
        """Generate category-aware suggestions based on user's opportunity preference."""
        
        # Get user's opportunity preference
        user_preference = getattr(user, 'opportunity_preference', None) or 'both'
        
        # Base suggestions for all users (identity basics)
        basic_suggestions = SuggestionEngine._get_basic_suggestions(user, profile)
        
        # Category-specific suggestions
        if user_preference == 'training_skills_programs':
            priority_suggestions = SuggestionEngine._get_training_priority_suggestions(user, profile)
        else:
            # Default to Jobs priorities (also for 'both')
            priority_suggestions = SuggestionEngine._get_jobs_priority_suggestions(user, profile)
        
        # Combine and limit
        all_suggestions = basic_suggestions + priority_suggestions
        return all_suggestions[:5]
    
    @staticmethod
    def _get_basic_suggestions(user: User, profile: Profile) -> List[Dict[str, Any]]:
        """Basic identity suggestions for all users."""
        suggestions = []
        
        if not user.full_name:
            suggestions.append({
                "id": "add_name",
                "title": "Add your name",
                "description": "Recruiters need to know who you are.",
                "impact": "+5%",
                "priority": 0,
                "action_link": "/profile/edit"
            })
        
        if not profile.avatar_url:
            suggestions.append({
                "id": "add_photo",
                "title": "Add a profile photo",
                "description": "Profiles with photos get 14x more views.",
                "impact": "+10%",
                "priority": 1,
                "action_link": "/profile/edit"
            })
            
        if not profile.headline:
            suggestions.append({
                "id": "add_headline",
                "title": "Add a professional headline",
                "description": "Summarize your role in one line.",
                "impact": "+10%",
                "priority": 2,
                "action_link": "/profile/edit"
            })
        
        return suggestions
    
    @staticmethod
    def _get_jobs_priority_suggestions(user: User, profile: Profile) -> List[Dict[str, Any]]:
        """
        Jobs-focused verification priorities:
        1. Work History - Confirm employment claims
        2. Skills Assessment - Validate technical abilities
        3. Peer Ratings - Social proof from colleagues
        4. Certifications - Industry credentials
        5. Education - Academic qualifications
        """
        suggestions = []
        
        # Priority 1: Work History (most important for jobs)
        has_experience = profile.experience_data and len(profile.experience_data) > 0
        if not has_experience:
            suggestions.append({
                "id": "add_experience",
                "title": "Add work experience",
                "description": "List your past roles to unlock premium job matches.",
                "impact": "+30%",
                "priority": 10,
                "action_link": "/profile/experience",
                "category_tip": "Jobs prioritize verified work history"
            })
        
        # Priority 2: Skills Assessment
        has_skills = profile.skills_data and len(profile.skills_data) > 0
        if not has_skills:
            suggestions.append({
                "id": "add_skills",
                "title": "Add and verify skills",
                "description": "Get your skills verified for 3x more profile views.",
                "impact": "+25%",
                "priority": 20,
                "action_link": "/profile/skills"
            })
        
        # Priority 3: Peer Ratings
        # Check if user has any ratings
        suggestions.append({
            "id": "request_ratings",
            "title": "Request peer ratings",
            "description": "Colleagues can endorse your work. Social proof matters.",
            "impact": "+20%",
            "priority": 30,
            "action_link": "/reputation/request"
        })
        
        # Priority 4: Certifications
        suggestions.append({
            "id": "add_certifications",
            "title": "Add certifications",
            "description": "Industry credentials boost your credibility.",
            "impact": "+15%",
            "priority": 40,
            "action_link": "/profile/certifications"
        })
        
        # Priority 5: Education (lower priority for jobs)
        has_education = profile.education_data and len(profile.education_data) > 0
        if not has_education:
            suggestions.append({
                "id": "add_education",
                "title": "Add education",
                "description": "Include your academic background.",
                "impact": "+10%",
                "priority": 50,
                "action_link": "/profile/education"
            })
        
        # Sort by priority and return top items
        suggestions.sort(key=lambda x: x.get('priority', 100))
        return suggestions[:3]
    
    @staticmethod
    def _get_training_priority_suggestions(user: User, profile: Profile) -> List[Dict[str, Any]]:
        """
        Training & Skills Programs verification priorities:
        1. Education - Confirm academic credentials (matric, NQF levels)
        2. Certifications - NQF-aligned qualifications
        3. Skills Portfolio - Projects and work samples
        4. References - Academic/mentor endorsements
        5. Volunteer/Projects - Demonstrated initiative
        """
        suggestions = []
        
        # Priority 1: Education (most important for training)
        has_education = profile.education_data and len(profile.education_data) > 0
        if not has_education:
            suggestions.append({
                "id": "add_education",
                "title": "Verify your education",
                "description": "Verify your matric certificate to qualify for learnerships.",
                "impact": "+30%",
                "priority": 10,
                "action_link": "/dashboard/verification",
                "category_tip": "Training programs require verified education"
            })
        
        # Priority 2: Certifications (NQF-aligned)
        suggestions.append({
            "id": "add_certifications",
            "title": "Add NQF certifications",
            "description": "Upload your transcripts for faster applications.",
            "impact": "+25%",
            "priority": 20,
            "action_link": "/profile/certifications"
        })
        
        # Priority 3: Skills Portfolio
        has_skills = profile.skills_data and len(profile.skills_data) > 0
        if not has_skills:
            suggestions.append({
                "id": "build_portfolio",
                "title": "Build your skills portfolio",
                "description": "Showcase projects and work samples to stand out.",
                "impact": "+20%",
                "priority": 30,
                "action_link": "/profile/skills"
            })
        
        # Priority 4: References (mentor/academic)
        suggestions.append({
            "id": "request_references",
            "title": "Get mentor references",
            "description": "Ask lecturers or mentors to endorse your potential.",
            "impact": "+15%",
            "priority": 40,
            "action_link": "/reputation/request"
        })
        
        # Priority 5: Volunteer/Projects
        suggestions.append({
            "id": "add_projects",
            "title": "Add projects & volunteer work",
            "description": "Show initiative even without formal experience.",
            "impact": "+10%",
            "priority": 50,
            "action_link": "/profile/projects"
        })
        
        # Sort by priority and return top items
        suggestions.sort(key=lambda x: x.get('priority', 100))
        return suggestions[:3]

