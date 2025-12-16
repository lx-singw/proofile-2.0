import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


# =============================================================================
# Category-Aware Notification Templates
# =============================================================================

# Jobs User Notification Templates
JOBS_NOTIFICATION_TEMPLATES = {
    "new_opportunities": {
        "title": "🎯 {count} new jobs match your profile",
        "message": "Check out these new opportunities that match your skills and experience level."
    },
    "profile_viewed": {
        "title": "👀 {company} viewed your profile",
        "message": "A recruiter from {company} is interested in your experience."
    },
    "salary_insight": {
        "title": "💰 Salary Alert: Your market value",
        "message": "Based on your skills, you could be earning {amount}. Update your expectations?"
    },
    "interview_reminder": {
        "title": "📅 Interview reminder: {time}",
        "message": "Your interview with {company} for {role} is {time}. Prepare now!"
    },
    "application_update": {
        "title": "📝 Application update: {company}",
        "message": "Your application for {role} at {company} has been {status}."
    },
    "skill_gap": {
        "title": "📈 Boost your profile with {skill}",
        "message": "Jobs you match need {skill}. Add it to increase your match scores!"
    }
}

# Training User Notification Templates
TRAINING_NOTIFICATION_TEMPLATES = {
    "new_opportunities": {
        "title": "🎓 {count} new training programs available",
        "message": "New learnerships and internships match your learning goals."
    },
    "profile_viewed": {
        "title": "👀 {company} reviewed your application",
        "message": "{company} is reviewing your learnership application."
    },
    "deadline_reminder": {
        "title": "⏰ Application closes: {program}",
        "message": "The deadline for {program} is {date}. Complete your application now!"
    },
    "mentor_message": {
        "title": "💬 Message from your mentor",
        "message": "{mentor} sent you feedback on your progress."
    },
    "course_progress": {
        "title": "📚 Keep up the momentum!",
        "message": "You're {percent}% through {course}. Only {remaining} modules left!"
    },
    "certificate_ready": {
        "title": "🏆 Certificate ready: {course}",
        "message": "Congratulations! Download your {course} certificate now."
    },
    "seta_eligibility": {
        "title": "✅ Complete your profile for SETA eligibility",
        "message": "Add your education details to qualify for registered learnerships."
    }
}


def get_notification_template(
    notification_type: str,
    opportunity_preference: Optional[str] = None
) -> Dict[str, str]:
    """
    Get the appropriate notification template based on user's category preference.
    
    Args:
        notification_type: Type of notification (new_opportunities, profile_viewed, etc.)
        opportunity_preference: 'jobs', 'training_skills_programs', or 'both'/None
        
    Returns:
        Dict with 'title' and 'message' templates
    """
    if opportunity_preference == 'training_skills_programs':
        templates = TRAINING_NOTIFICATION_TEMPLATES
    else:
        templates = JOBS_NOTIFICATION_TEMPLATES
    
    return templates.get(notification_type, {
        "title": "📢 Update from Proofile",
        "message": "You have a new notification."
    })


def format_notification(
    notification_type: str,
    opportunity_preference: Optional[str] = None,
    **kwargs
) -> Dict[str, str]:
    """
    Format a notification with category-aware template and provided values.
    
    Args:
        notification_type: Type of notification
        opportunity_preference: User's category preference
        **kwargs: Values to interpolate into the template
        
    Returns:
        Dict with formatted 'title' and 'message'
    """
    template = get_notification_template(notification_type, opportunity_preference)
    
    try:
        title = template["title"].format(**kwargs)
        message = template["message"].format(**kwargs)
    except KeyError:
        # Fallback if missing template variables
        title = template["title"]
        message = template["message"]
    
    return {"title": title, "message": message}


# =============================================================================
# Email Functions
# =============================================================================

async def send_email(to_email: str, subject: str, content: str):
    """
    Send an email notification.
    For now, this just logs the email content.
    In production, integrate with SendGrid/AWS SES.
    """
    logger.info(f"Sending email to {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Content: {content}")
    
    # Mock success
    return True


async def send_analysis_complete_email(user_email: str, resume_name: str, score: int):
    subject = f"Analysis Complete: {resume_name}"
    content = f"""
    Hello,
    
    Your resume '{resume_name}' has been analyzed!
    
    Overall Score: {score}/100
    
    View your full analysis here: https://proofile.app/resume/analysis
    
    Best regards,
    Proofile Team
    """
    await send_email(user_email, subject, content)


async def send_weekly_tips_email(user_email: str):
    subject = "Your Weekly Career Tips"
    content = "Here are your personalized tips for this week..."
    await send_email(user_email, subject, content)


# =============================================================================
# Category-Aware Notification Functions
# =============================================================================

async def send_new_opportunities_notification(
    db_session,
    user_id: int,
    opportunity_preference: str,
    count: int = 5
):
    """Send notification about new matching opportunities."""
    from app.models.notification import Notification
    
    formatted = format_notification(
        "new_opportunities",
        opportunity_preference,
        count=count
    )
    
    notification = Notification(
        user_id=user_id,
        type="opportunity",
        title=formatted["title"],
        message=formatted["message"],
        link="/opportunities",
        read=False
    )
    db_session.add(notification)
    await db_session.commit()
    
    logger.info(f"Sent new_opportunities notification to user {user_id}")
    return notification


async def send_profile_viewed_notification(
    db_session,
    user_id: int,
    opportunity_preference: str,
    company: str
):
    """Send notification when a company views the user's profile."""
    from app.models.notification import Notification
    
    formatted = format_notification(
        "profile_viewed",
        opportunity_preference,
        company=company
    )
    
    notification = Notification(
        user_id=user_id,
        type="profile_view",
        title=formatted["title"],
        message=formatted["message"],
        link="/analytics",
        read=False
    )
    db_session.add(notification)
    await db_session.commit()
    
    logger.info(f"Sent profile_viewed notification to user {user_id}")
    return notification


async def send_deadline_notification(
    db_session,
    user_id: int,
    opportunity_preference: str,
    program: str = None,
    company: str = None,
    role: str = None,
    date: str = None,
    time: str = None
):
    """Send deadline/reminder notification appropriate to user category."""
    from app.models.notification import Notification
    
    if opportunity_preference == 'training_skills_programs':
        formatted = format_notification(
            "deadline_reminder",
            opportunity_preference,
            program=program,
            date=date
        )
    else:
        formatted = format_notification(
            "interview_reminder",
            opportunity_preference,
            company=company,
            role=role,
            time=time
        )
    
    notification = Notification(
        user_id=user_id,
        type="reminder",
        title=formatted["title"],
        message=formatted["message"],
        link="/calendar",
        read=False
    )
    db_session.add(notification)
    await db_session.commit()
    
    logger.info(f"Sent deadline notification to user {user_id}")
    return notification
