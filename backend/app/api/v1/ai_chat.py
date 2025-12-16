"""
AI Chat API: Career coaching, profile analysis, and AI-powered assistance
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import json

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.profile import Profile
from app.models.ai_chat import ChatSession, ChatMessage
from app.schemas.ai_chat import (
    ChatRequest, ChatResponse, ChatMessageResponse,
    ChatSessionCreate, ChatSessionResponse, ChatSessionWithMessages,
    ProfileAnalysis, ProfileInsight
)

router = APIRouter()


def calculate_profile_completeness(user: User, profile: Optional[Profile]) -> int:
    """Calculate profile completeness score 0-100."""
    score = 0
    max_score = 100
    
    # Basic info (30 points)
    if user.full_name:
        score += 10
    if user.bio:
        score += 10
    if user.profile_photo_url:
        score += 10
    
    # Profile details (30 points)
    if profile:
        if profile.headline:
            score += 15
        if profile.summary:
            score += 15
    
    # Skills and experience (20 points)
    if user.skills:
        try:
            skills = json.loads(user.skills)
            if len(skills) >= 3:
                score += 20
            elif len(skills) >= 1:
                score += 10
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Professional info (20 points)
    if user.industry:
        score += 10
    if user.experience_level:
        score += 10
    
    return min(score, max_score)


def generate_profile_insights(user: User, profile: Optional[Profile], completeness: int) -> List[ProfileInsight]:
    """Generate AI-powered profile improvement suggestions."""
    insights = []
    
    # Check for missing elements and suggest improvements
    if not user.profile_photo_url:
        insights.append(ProfileInsight(
            category="profile",
            title="Add a professional photo",
            description="Profiles with photos get 21x more views. Add a clear, professional headshot.",
            priority="high",
            action_url="/profile"
        ))
    
    if not profile or not profile.headline:
        insights.append(ProfileInsight(
            category="profile",
            title="Create a compelling headline",
            description="Your headline is the first thing people see. Make it count with your role and key strength.",
            priority="high",
            action_url="/profile"
        ))
    
    if not profile or not profile.summary:
        insights.append(ProfileInsight(
            category="profile",
            title="Write your professional summary",
            description="A strong summary tells your story. Include your experience, skills, and career goals.",
            priority="high",
            action_url="/profile"
        ))
    
    if not user.skills:
        insights.append(ProfileInsight(
            category="skills",
            title="Add your skills",
            description="Skills help recruiters find you. Add at least 5 relevant skills to improve visibility.",
            priority="high",
            action_url="/profile"
        ))
    else:
        try:
            skills = json.loads(user.skills)
            if len(skills) < 5:
                insights.append(ProfileInsight(
                    category="skills",
                    title="Add more skills",
                    description=f"You have {len(skills)} skills. Add more to increase your profile visibility.",
                    priority="medium",
                    action_url="/profile"
                ))
        except (json.JSONDecodeError, TypeError):
            pass
    
    if not user.bio:
        insights.append(ProfileInsight(
            category="profile",
            title="Add a bio",
            description="A personal bio helps others connect with you. Share what drives you professionally.",
            priority="medium",
            action_url="/profile"
        ))
    
    if completeness >= 80:
        insights.append(ProfileInsight(
            category="growth",
            title="Get verified",
            description="Verification builds trust. Verify your email, education, or employment to stand out.",
            priority="medium",
            action_url="/verification"
        ))
    
    return insights


def generate_ai_response(user: User, message: str, context: str) -> str:
    """Generate AI response based on user message, context, and opportunity preference.
    
    In production, this would call OpenAI/Anthropic API.
    For now, provides intelligent template-based responses personalized by category.
    """
    message_lower = message.lower()
    
    # Get user's opportunity preference for personalized coaching
    opportunity_pref = getattr(user, 'opportunity_preference', None) or 'both'
    is_training_user = opportunity_pref == 'training_skills_programs'
    is_jobs_user = opportunity_pref == 'jobs'
    
    # Career advice responses - personalized by category
    if any(word in message_lower for word in ["career", "job", "role", "position", "opportunity"]):
        if is_training_user:
            return f"""Based on your profile as a {user.experience_level or 'learner'} in {user.industry or 'your field'}, here's career guidance for your learning journey:

1. **Build Your Foundation**: Focus on completing learnerships and internships that provide structured learning with practical experience.

2. **Certification Path**: Consider SETA-registered qualifications that are recognized by employers in South Africa.

3. **Portfolio Building**: Start documenting your projects and coursework - even school projects count!

4. **Find Mentors**: Connect with professionals who can guide your career development.

5. **Explore Apprenticeships**: Trade and technical apprenticeships offer excellent career pathways.

Would you like help finding training programs or connecting with mentors?"""
        else:  # Jobs user or both
            return f"""Based on your profile as a {user.experience_level or 'professional'} in {user.industry or 'your field'}, here are career insights:

1. **Market Position**: Assess your salary against market rates. Are you being compensated fairly?

2. **Your Strengths**: Your experience level gives you negotiating power. Highlight key achievements.

3. **Growth Opportunities**: Consider roles that offer leadership growth or new technical challenges.

4. **Networking**: Senior professionals and recruiters can open doors. Build strategic connections.

5. **Interview Prep**: Keep your STAR stories ready for behavioral interviews.

Would you like specific advice on salary negotiation, job searching, or interview preparation?"""

    # Skills-related responses - personalized by category
    if any(word in message_lower for word in ["skill", "learn", "training", "course", "certification"]):
        if is_training_user:
            return f"""Great question about skills development! Here's what I recommend for learners:

1. **Start with Basics**: Master foundational skills before moving to advanced topics. Python, Excel, and communication are universal.

2. **SETA Qualifications**: Look for NQF-aligned courses that count toward formal qualifications.

3. **Free Resources**: Use platforms like Coursera, edX, or YouTube for supplementary learning.

4. **Practical Projects**: Build a portfolio - even small projects demonstrate capability.

5. **Soft Skills Matter**: Employers value initiative, reliability, and willingness to learn.

6. **Track Progress**: Document your learning journey - it shows dedication to growth.

What area would you like to develop first - technical skills, soft skills, or both?"""
        else:  # Jobs user
            return f"""Great question about skills development! Here's what I recommend for professionals:

1. **Assess Current Skills**: Review your profile. Are your skills aligned with market demands?

2. **Identify Gaps**: Based on job listings in your field, what skills are commonly requested?

3. **Strategic Certifications**: AWS, PMP, or industry-specific certs can boost your market value.

4. **Leadership Skills**: Soft skills like communication and management become crucial for career growth.

5. **Stay Current**: Technology evolves rapidly. Dedicate time to continuous learning.

6. **Get Endorsed**: Ask colleagues to verify your skills for social proof.

What specific skill areas are you looking to develop for career advancement?"""

    # Resume/profile help - personalized by category
    if any(word in message_lower for word in ["resume", "cv", "profile", "portfolio"]):
        if is_training_user:
            return f"""I'd be happy to help you build a strong profile as a learner! Here are some tips:

1. **Highlight Potential**: Focus on what you're learning, not just what you know.

2. **Academic Projects**: School and course projects count as experience - describe them well!

3. **Volunteer Work**: Any community or volunteer experience shows initiative.

4. **Certifications**: List all your certificates, even online course completions.

5. **Career Goals**: Clearly state what you want to learn and where you want to grow.

6. **Mentor References**: Include references from teachers, mentors, or supervisors.

Would you like help optimizing your profile for internship or learnership applications?"""
        else:  # Jobs user
            return f"""I'd be happy to help with your professional profile! Here are some tips:

1. **Strong Headline**: Capture your role and value proposition in under 120 characters.

2. **Quantify Achievements**: Use numbers to demonstrate impact (e.g., "Increased sales by 25%").

3. **Keywords**: Include industry-relevant keywords that recruiters search for.

4. **Professional Photo**: A clear, professional headshot significantly increases profile views.

5. **Leadership Examples**: Highlight team leadership, mentorship, or project ownership.

6. **Results Focus**: Employers care about outcomes, not just responsibilities.

Try our Resume Builder tool for AI-powered resume optimization!"""

    # Interview preparation - personalized by category
    if any(word in message_lower for word in ["interview", "prepare", "question"]):
        if is_training_user:
            return """Here's how to prepare for learnership or internship interviews:

1. **Research the Program**: Understand the company, what you'll learn, and the career path.

2. **Show Enthusiasm**: Employers value learners who are excited and eager to grow.

3. **Prepare Examples**: Think of times you showed initiative, solved problems, or worked in teams.

4. **Ask Good Questions**: "What skills will I develop?" "Who will mentor me?"

5. **Be Honest**: It's okay to not know everything - show you're willing to learn.

6. **Practice Basics**: Introduce yourself confidently and explain your career goals.

Would you like to practice answering common learnership interview questions?"""
        else:  # Jobs user
            return """Here's how to prepare for your next job interview:

1. **Research the Company**: Understand their mission, recent news, and culture.

2. **STAR Method**: Structure answers with Situation, Task, Action, Result.

3. **Salary Research**: Know your market value before discussing compensation.

4. **Prepare Questions**: Have thoughtful questions ready for the interviewer.

5. **Practice Technical Questions**: Review relevant technical concepts for your field.

6. **Negotiate Confidently**: Be prepared to discuss salary expectations professionally.

Would you like to practice specific interview scenarios or discuss salary negotiation strategies?"""

    # Default helpful response - personalized by category
    if is_training_user:
        return f"""Thanks for your question! As your AI learning coach, I'm here to help with:

• **Learning Paths**: Finding the right courses and qualifications
• **Learnerships**: Discovering SETA-registered programs
• **Internships**: Preparing for and finding internship opportunities
• **Skills Building**: Identifying what skills to learn first
• **Mentorship**: Connecting with mentors in your field
• **Career Entry**: Preparing for your first role

What would you like to focus on today? I'm here to support your learning journey!"""
    else:  # Jobs user or both
        return f"""Thanks for your question! As your AI career assistant, I'm here to help with:

• **Career Planning**: Setting goals and mapping your career path
• **Profile Optimization**: Making your profile stand out to recruiters
• **Job Search**: Finding and applying to the right opportunities
• **Skill Development**: Identifying skills to learn and grow
• **Interview Prep**: Getting ready to ace your interviews
• **Salary Negotiation**: Getting paid what you're worth

What would you like to focus on today? Feel free to ask me anything about your career journey!"""


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all chat sessions for the current user."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific chat session with all messages."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Load messages
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = messages_result.scalars().all()
    
    return ChatSessionWithMessages(
        id=session.id,
        title=session.title,
        session_type=session.session_type,
        is_active=session.is_active,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[ChatMessageResponse.model_validate(m) for m in messages]
    )


@router.post("/chat", response_model=ChatResponse)
async def send_chat_message(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message and get AI response."""
    session = None
    
    # Get or create session
    if data.session_id:
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.id == data.session_id, ChatSession.user_id == current_user.id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        # Create new session
        session = ChatSession(
            user_id=current_user.id,
            session_type=data.session_type,
            title=data.message[:50] + "..." if len(data.message) > 50 else data.message
        )
        db.add(session)
        await db.flush()
    
    # Create user message
    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=data.message
    )
    db.add(user_message)
    
    # Generate AI response
    # Get context about user's profile
    profile_result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    
    context = f"User: {current_user.full_name or 'Anonymous'}, Industry: {current_user.industry or 'Not specified'}, Experience: {current_user.experience_level or 'Not specified'}"
    
    ai_response_text = generate_ai_response(current_user, data.message, context)
    
    # Create assistant message
    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_response_text,
        tokens_used=len(ai_response_text.split()) * 2  # Rough estimate
    )
    db.add(assistant_message)
    
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    await db.refresh(session)
    
    return ChatResponse(
        session_id=session.id,
        user_message=ChatMessageResponse.model_validate(user_message),
        assistant_message=ChatMessageResponse.model_validate(assistant_message)
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a chat session and all its messages."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    await db.delete(session)
    await db.commit()


@router.get("/profile-analysis", response_model=ProfileAnalysis)
async def get_profile_analysis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI analysis of the current user's profile."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Get profile
        profile_result = await db.execute(
            select(Profile).where(Profile.user_id == current_user.id)
        )
        profile = profile_result.scalar_one_or_none()
        
        # Safe attribute access for CachedUser
        user_full_name = getattr(current_user, 'full_name', None)
        user_bio = getattr(current_user, 'bio', None)
        user_profile_photo_url = getattr(current_user, 'profile_photo_url', None)
        user_skills = getattr(current_user, 'skills', None)
        user_industry = getattr(current_user, 'industry', None)
        user_experience_level = getattr(current_user, 'experience_level', None)
        
        # Calculate completeness inline with safe access
        completeness = 0
        if user_full_name:
            completeness += 10
        if user_bio:
            completeness += 10
        if user_profile_photo_url:
            completeness += 10
        if profile:
            if profile.headline:
                completeness += 15
            if profile.summary:
                completeness += 15
        if user_skills:
            try:
                skills = json.loads(user_skills) if isinstance(user_skills, str) else user_skills
                if skills and len(skills) >= 3:
                    completeness += 20
                elif skills and len(skills) >= 1:
                    completeness += 10
            except:
                pass
        if user_industry:
            completeness += 10
        if user_experience_level:
            completeness += 10
        completeness = min(completeness, 100)
        
        # Generate strengths
        strengths = []
        if user_full_name:
            strengths.append("Professional name displayed")
        if user_profile_photo_url:
            strengths.append("Profile photo added")
        if profile and profile.headline:
            strengths.append("Compelling headline set")
        if profile and profile.summary:
            strengths.append("Professional summary written")
        if user_skills:
            try:
                skills = json.loads(user_skills) if isinstance(user_skills, str) else user_skills
                if skills and len(skills) >= 5:
                    strengths.append(f"Strong skills section with {len(skills)} skills")
            except:
                pass
        if user_industry:
            strengths.append(f"Industry focus: {user_industry}")
        
        if not strengths:
            strengths = ["Getting started on your professional journey"]
        
        # Generate improvements
        improvements = []
        if not user_profile_photo_url:
            improvements.append(ProfileInsight(
                category="profile",
                title="Add a professional photo",
                description="Profiles with photos get 21x more views.",
                priority="high",
                action_url="/profile"
            ))
        if not profile or not profile.headline:
            improvements.append(ProfileInsight(
                category="profile",
                title="Create a compelling headline",
                description="Your headline is the first thing people see.",
                priority="high",
                action_url="/profile"
            ))
        if not user_skills:
            improvements.append(ProfileInsight(
                category="skills",
                title="Add your skills",
                description="Skills help recruiters find you.",
                priority="high",
                action_url="/profile"
            ))
        
        # Generate opportunities
        opportunities = []
        if user_industry:
            opportunities.append(f"Explore trending roles in {user_industry}")
        opportunities.append("Connect with professionals in your network")
        opportunities.append("Apply to recommended jobs matching your profile")
        if user_experience_level:
            opportunities.append(f"Find {user_experience_level}-level opportunities")
        
        # Skill gaps
        skill_gaps = []
        if not user_skills:
            skill_gaps.append("Add skills to identify gaps")
        else:
            skill_gaps.append("Consider adding emerging skills in your industry")
        
        return ProfileAnalysis(
            completeness_score=completeness,
            strengths=strengths,
            improvements=improvements,
            career_opportunities=opportunities,
            skill_gaps=skill_gaps
        )
        
    except Exception as e:
        logger.exception("Error in get_profile_analysis: %s", e)
        # Return a minimal valid response on error
        return ProfileAnalysis(
            completeness_score=0,
            strengths=["Getting started on your professional journey"],
            improvements=[],
            career_opportunities=["Connect with professionals"],
            skill_gaps=["Add skills to your profile"]
        )
