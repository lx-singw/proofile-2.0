from fastapi import APIRouter
from app.api.v1 import users, auth, profiles, jobs, opportunities, ws, ai, resumes, activities, notifications, resume, agents, experience, portfolio
from app.api.v1 import social, ai_chat, verifications, discovery, analytics, personalization, agent_actions, payments, institutional, identity, guilds
from app.api.v1 import opportunity_feed, ingest
from app.routers import ratings, rating_requests, collaborators, verifications_peer
from app.core.config import settings

# Verification v2 routes (L1-L3 trust system)
from app.api.v1.verification import identity_router, skills_router, documents_router, employment_router
# Webhook handlers
from app.api.v1.webhooks import stripe_router, sendgrid_router

try:
	# import test_events lazily
	from app.api.v1 import test_events
except Exception:
	test_events = None

api_router = APIRouter(prefix="/api/v1") # Add prefix here for consistency

# Include your endpoint routers here
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(experience.router, prefix="/experience", tags=["experience"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
# Disabled for MVP — uncomment when ready:
# api_router.include_router(payments.router, tags=["payments"])
# api_router.include_router(institutional.router, tags=["institutional"])
# api_router.include_router(identity.router, prefix="/.well-known", tags=["identity"])
# api_router.include_router(guilds.router, tags=["community"])

# AI Agents
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(agent_actions.router, tags=["agent-actions"])

# Opportunities (new primary route) and Jobs (legacy alias for backward compatibility)
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])  # Keep for backward compatibility

# Opportunity Feed (anonymous-first, ranked, cursor-based)
api_router.include_router(opportunity_feed.router)
api_router.include_router(ingest.router)

api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(resume.upload_router, prefix="/resume", tags=["resume-upload"])
api_router.include_router(resume.analysis_router, prefix="/resume", tags=["resume-analysis"])
api_router.include_router(resume.refine_router, prefix="/resume", tags=["resume-refine"])
api_router.include_router(resume.build_router, prefix="/resume", tags=["resume-build"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Social features: follow, connect, star, endorse, rate
api_router.include_router(social.router, prefix="/social", tags=["social"])

# Ratings: professional ratings with anti-gaming measures
api_router.include_router(ratings.router, tags=["ratings"])

# Rating Requests: invitation-based rating flow
api_router.include_router(rating_requests.router, tags=["rating-requests"])



# Project Collaborators: Verified Work Graph
api_router.include_router(collaborators.router, tags=["collaborators"])

# AI Chat: career coaching, profile analysis
api_router.include_router(ai_chat.router, prefix="/ai-chat", tags=["ai-chat"])

# Verifications: email, phone, identity, education, employment
api_router.include_router(verifications.router, prefix="/verifications", tags=["verifications"])
# Peer Verifications: Crowdsourced Truth
api_router.include_router(verifications_peer.router, tags=["verifications-peer"])

# Verification v2 Routes: L1-L3 Trust Protocol
api_router.include_router(identity_router, prefix="/verify", tags=["verify-identity"])
api_router.include_router(skills_router, prefix="/verify", tags=["verify-skills"])
api_router.include_router(documents_router, prefix="/verify", tags=["verify-documents"])
api_router.include_router(employment_router, prefix="/verify", tags=["verify-employment"])

# Webhooks: external service callbacks
api_router.include_router(stripe_router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(sendgrid_router, prefix="/webhooks", tags=["webhooks"])

# Discovery: find and explore profiles
api_router.include_router(discovery.router, prefix="/discovery", tags=["discovery"])

# Analytics: profile views, career insights, event tracking
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Personalization: user preferences and context for 11 dimensions
api_router.include_router(personalization.router, prefix="/personalization", tags=["personalization"])

# Feed: posts, reactions, comments (authenticated)
try:
    from app.api.v1 import feed
    api_router.include_router(feed.router, tags=["feed"])
except ImportError:
    pass

# Portal: public jobs portal (no auth required)
try:
    from app.api.v1 import portal
    api_router.include_router(portal.router, tags=["portal"])
except ImportError:
    pass

# Test-only endpoints for e2e / local validation. Enable in test or development,
# or when explicitly allowed via ENABLE_TEST_ROUTES. This keeps test helpers out of
# production while allowing local E2E runs to call test-only endpoints.
if settings.ENVIRONMENT in ("test", "development") or getattr(settings, "ENABLE_TEST_ROUTES", False):
	if test_events is not None:
		api_router.include_router(test_events.router, prefix="/test", tags=["test"])

# WebSocket router for worker notifications (connect to /api/v1/ws/{user_id})
api_router.include_router(ws.router, prefix="/ws", tags=["ws"])