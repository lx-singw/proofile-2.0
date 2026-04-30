"""
The Main Application (backend/app/main.py)
This is the heart of the backend. It initializes the FastAPI application, includes our API router,
and adds a simple /health check endpoint so we can confirm everything is running.
"""
import logging
import os
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
import time
from app.core.rate_limit import RateLimitMiddleware
from urllib.parse import urlparse
from contextlib import asynccontextmanager
from app.core import config, database
from app.api.v1.api import api_router
from app.core.http_client import close_client
from app.services.ai_service import close_client as close_ai_client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize connections
    """
    This context manager is used to initialize and close connections
    to the database and Redis at application startup and shutdown.
    
    It logs the environment and a redacted DB URL to verify config,
    and establishes a Redis connection if the REDIS_URL setting is set.
    If the REDIS_URL setting is not set, it logs a warning and skips
    establishing the Redis connection.
    
    After yielding, it closes any established connections when the application
    is shut down.
    """

    logger.info("--- Application Startup ---")
    # Log environment and a redacted DB URL to verify config
    logger.info(f"Environment: {config.settings.ENVIRONMENT}")
    if config.settings.DATABASE_URL:
        parsed_url = urlparse(config.settings.DATABASE_URL)
        safe_url = parsed_url._replace(netloc=f"****:****@{parsed_url.hostname}:{parsed_url.port}").geturl()
        logger.info(f"Database URL: {safe_url}")
    else:
        logger.error("DATABASE_URL is not set!")

    # --- Run Alembic migrations at startup using Alembic API ---
    try:
        from alembic.config import Config
        from alembic import command
        logger.info("Running Alembic migrations at startup using Alembic API...")
        alembic_cfg = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../alembic.ini'))
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, lambda: command.upgrade(alembic_cfg, "head"))
        logger.info("Alembic migrations applied successfully.")
    except Exception as e:
        logger.error(f"Error running Alembic migrations: {e}")

    RedisError = Exception  # Fallback when redis client is unavailable
    try:
        import redis.asyncio as redis
        RedisError = redis.RedisError  # type: ignore[attr-defined]
    except ImportError as e:
        logger.warning(f"Redis client not installed, skipping connection: {e}")
        app.state.redis = None
    else:
        try:
            app.state.redis = redis.from_url(
                config.settings.REDIS_URL,
                encoding="utf8",
                decode_responses=True,
            )
            logger.info("Redis connection established.")
        except (ConnectionError, RedisError) as e:
            logger.warning(f"Redis connection skipped: {e}")
            app.state.redis = None
        except Exception as e:
            logger.error(f"Unexpected error during Redis setup: {e}")
            app.state.redis = None

    yield

    # Shutdown: Close connections
    redis_client = getattr(app.state, "redis", None)
    if redis_client:
        try:
            await redis_client.close()
            logger.info("Redis connection closed.")
        except (ConnectionError, RedisError) as e:
            logger.warning(f"Error closing Redis connection: {e}")
        except Exception as e:
            logger.error(f"Unexpected error closing Redis connection: {e}")
    await database.dispose_engine()
    # Close module-level HTTP client (if initialized) to ensure clean shutdown
    try:
        await close_client()
        logger.info("HTTP client closed.")
    except Exception as e:
        logger.error(f"Error closing HTTP client: {e}")
        
    try:
        await close_ai_client()
        logger.info("AI HTTP client closed.")
    except Exception as e:
        logger.error(f"Error closing AI HTTP client: {e}")

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        This middleware adds basic security headers to every response:

        - X-Content-Type-Options: nosniff
        - X-Frame-Options: DENY
        - X-XSS-Protection: 1; mode=block
        - Referrer-Policy: no-referrer
        - Permissions-Policy: geolocation=()

        Additionally, it adds a simple Server-Timing header for visibility.
        The Server-Timing header has the format:
        Server-Timing: app;dur=<duration in ms>

        Where <duration in ms> is the time it took to serve the request in milliseconds.
        """
        
        start = time.time()
        response = await call_next(request)
        # Basic security headers (can be tightened for production)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=()")
        # Content Security Policy — permissive default for SPA; tighten in production
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.openai.com https://api.stripe.com"
        )
        # Simple server-timing for visibility
        response.headers.setdefault("Server-Timing", f"app;dur={(time.time()-start)*1000:.1f}")
        return response

middleware = [
    Middleware(GZipMiddleware, minimum_size=1024),
]

# Conditionally add TrustedHost and Session if configured
if getattr(config.settings, "TRUSTED_HOSTS", None):
    middleware.append(Middleware(TrustedHostMiddleware, allowed_hosts=config.settings.TRUSTED_HOSTS))

app = FastAPI(title=config.settings.PROJECT_NAME, lifespan=lifespan, debug=getattr(config.settings, "DEBUG", False), middleware=middleware)

# CORS configuration
cors_origins = ["*"] if config.settings.ENVIRONMENT == "test" else (getattr(config.settings, "BACKEND_CORS_ORIGINS", []) or [])
if not cors_origins:
    cors_origins = ["http://localhost:3000", "http://localhost:8000"]  # Default development origins

# Add middleware in order: CORS, rate limiting, auth middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Content-Type", 
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-XSRF-TOKEN",
    ],
    expose_headers=["*"],
    max_age=86400,
)

# Rate limiting configuration (environment-dependent)
if config.settings.ENVIRONMENT == "test":
    # Very high limits for tests, effectively disabling for most,
    # but allowing specific tests to override via custom client.
    DEFAULT_REQUESTS = 10000
    LOGIN_REQUESTS = 10000
    REGISTRATION_REQUESTS = 10000
else:
    DEFAULT_REQUESTS = config.settings.RATE_LIMIT_DEFAULT_REQUESTS
    LOGIN_REQUESTS = config.settings.RATE_LIMIT_LOGIN_REQUESTS
    REGISTRATION_REQUESTS = config.settings.RATE_LIMIT_REGISTRATION_REQUESTS

# Define the default and specific rate limits
RATE_LIMIT_DEFAULT = (DEFAULT_REQUESTS, config.settings.RATE_LIMIT_DEFAULT_WINDOW)
RATE_LIMIT_CONFIG = {
    "/api/v1/auth/token": (LOGIN_REQUESTS, config.settings.RATE_LIMIT_LOGIN_WINDOW),
    "/api/v1/users": (REGISTRATION_REQUESTS, config.settings.RATE_LIMIT_REGISTRATION_WINDOW),
    # Add other specific endpoints if needed
}

# Add security headers
app.add_middleware(SecurityHeadersMiddleware)

# Add rate limiting if Redis is available and not running tests
if config.settings.ENVIRONMENT not in ("test", "development"):
    try:
        import redis.asyncio as redis
        app.add_middleware(
            RateLimitMiddleware,
            redis_url=config.settings.REDIS_URL,
            rate_limits=RATE_LIMIT_CONFIG,
            default_rate_limit=RATE_LIMIT_DEFAULT
        )
        logger.info("Rate limiting middleware enabled.")
    except ImportError:
        logger.warning("redis package not installed, rate limiting disabled")

# API router
app.include_router(api_router)

# Standardized exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handles HTTPExceptions and returns a JSONResponse with the error detail.

    :param request: The current request
    :param exc: The caught HTTPException
    :return: A JSONResponse with the error detail
    """
    # For client-side errors (4xx), log as info instead of exception to reduce noise.
    if 400 <= exc.status_code < 500:
        logger.info(f"HTTPException caught: {exc.status_code} {exc.detail}")
    else: # For server-side errors (5xx), log the full exception.
        logger.exception(f"HTTPException caught: {exc.status_code} {exc.detail}", exc_info=exc)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Validation errors are commonly caused by user input; log at DEBUG to
    # avoid filling logs during normal client-side validation failures.
    logger.debug("RequestValidationError caught: %s", exc)
    errors = []
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    for error in exc.errors():
        error_dict = dict(error)
        if 'ctx' in error_dict and 'error' in error_dict['ctx']:
            # Extract the error message from ValueError
            if isinstance(error_dict['ctx']['error'], ValueError):
                error_dict['msg'] = str(error_dict['ctx']['error'])
            del error_dict['ctx']
        
        # Handle bytes input
        if 'input' in error_dict and isinstance(error_dict['input'], bytes):
            try:
                error_dict['input'] = error_dict['input'].decode('utf-8')
            except UnicodeDecodeError:
                error_dict['input'] = str(error_dict['input'])
                
        if error_dict.get("type") == "json_invalid":
            status_code = status.HTTP_400_BAD_REQUEST

        errors.append(error_dict)
    return JSONResponse(status_code=status_code, content={"detail": errors})


@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    if config.settings.ENVIRONMENT in ("development", "test"):
        import traceback
        tb = traceback.format_exc()
        return JSONResponse(status_code=500, content={"detail": f"Internal server error: {tb}"})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

@app.get("/health", tags=["health"])  # Lightweight readiness/liveness probe
async def health_check(request: Request):
    """
    Health check endpoint that verifies database and Redis connectivity.
    """
    health = {"status": "ok", "project_name": config.settings.PROJECT_NAME}

    # Check database connectivity
    try:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception as e:
        health["status"] = "degraded"
        health["database"] = f"error: {type(e).__name__}"

    # Check Redis connectivity
    redis_client = getattr(request.app.state, "redis", None)
    if redis_client:
        try:
            await redis_client.ping()
            health["redis"] = "connected"
        except Exception as e:
            health["status"] = "degraded"
            health["redis"] = f"error: {type(e).__name__}"
    else:
        health["redis"] = "not configured"

    status_code = 200 if health["status"] == "ok" else 503
    return JSONResponse(content=health, status_code=status_code)
