from fastapi import APIRouter
from app.api.v1 import users, auth, profiles, jobs, ws, ai, resumes, activities, notifications, resume
from app.core.config import settings
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
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(resume.upload_router, prefix="/resume", tags=["resume-upload"])
api_router.include_router(resume.analysis_router, prefix="/resume", tags=["resume-analysis"])
api_router.include_router(resume.refine_router, prefix="/resume", tags=["resume-refine"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Test-only endpoints for e2e / local validation. Enable in test or development,
# or when explicitly allowed via ENABLE_TEST_ROUTES. This keeps test helpers out of
# production while allowing local E2E runs to call test-only endpoints.
if settings.ENVIRONMENT in ("test", "development") or getattr(settings, "ENABLE_TEST_ROUTES", False):
	if test_events is not None:
		api_router.include_router(test_events.router, prefix="/test", tags=["test"])

# WebSocket router for worker notifications (connect to /api/v1/ws/{user_id})
api_router.include_router(ws.router, prefix="/ws", tags=["ws"])