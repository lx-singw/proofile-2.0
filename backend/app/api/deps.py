"""
FastAPI dependencies for the application.

Dependencies are used for things like getting a database session or
getting the current authenticated user.
"""
import asyncio
from dataclasses import dataclass, replace
from datetime import datetime
import time
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

# --- Core Dependencies ---
from app.core.database import get_db
from app.core import security
from app.core.config import settings # Import settings to get JWT_AUDIENCE
from app.models.user import User, UserRole, UserPersona
from app.schemas.token import TokenData
import logging

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 0.0

@dataclass(frozen=True)
class CachedUser:
    id: int
    email: str
    full_name: str | None
    username: str | None
    role: UserRole
    persona: UserPersona | None
    experience_level: str | None
    primary_goal: str | None
    industry: str | None
    opportunity_preference: str | None
    years_experience: int | None
    province: str | None
    city: str | None
    willing_to_relocate: bool
    career_intent: str | None
    available_from: str | None
    notice_period_weeks: int | None
    salary_expectation_min: int | None
    salary_expectation_max: int | None
    salary_negotiable: bool
    work_mode_preference: str | None
    max_commute_minutes: int | None
    is_active: bool
    created_at: datetime | None

_token_cache: dict[str, tuple[CachedUser, float]] = {}
_token_locks: dict[str, asyncio.Lock] = {}
_MAX_CACHE_SIZE = 1000

def _evict_expired_cache_entries():
    """Remove expired entries to prevent unbounded cache growth."""
    now = time.monotonic()
    expired = [token for token, (_, expires_at) in _token_cache.items() if expires_at <= now]
    for token in expired:
        _token_cache.pop(token, None)
        _token_locks.pop(token, None)
    
    # If still too large, remove oldest entries
    if len(_token_cache) > _MAX_CACHE_SIZE:
        sorted_entries = sorted(_token_cache.items(), key=lambda x: x[1][1])
        for token, _ in sorted_entries[:len(_token_cache) - _MAX_CACHE_SIZE]:
            _token_cache.pop(token, None)
            _token_locks.pop(token, None)

# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# --- Authentication Dependencies --- #
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> CachedUser:
    # Periodically clean up expired entries
    if len(_token_cache) > _MAX_CACHE_SIZE * 0.8:
        _evict_expired_cache_entries()
    
    lock = _token_locks.setdefault(token, asyncio.Lock())
    async with lock:
        now = time.monotonic()
        cached_entry = _token_cache.get(token)
        if cached_entry:
            cached_user, expires_at = cached_entry
            if expires_at > now:
                return replace(cached_user)
            _token_cache.pop(token, None)
            _token_locks.pop(token, None)

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            # Decode token with strict audience and expiry validation
            logger.debug("Decoding token length=%s first16=%s", len(token or ""), (token or "")[:16])
            payload = security.decode_access_token(token)
            logger.debug("Decoded payload keys: %s", list(payload.keys()))

            # Extract user identifier
            username = payload.get("sub")
            logger.debug("Username from payload: %r", username)
            if not username:
                logger.warning("Authentication failed: missing subject in token")
                raise credentials_exception

        except JWTError as e:
            logger.warning("Authentication failed: token validation error - %s", str(e))
            raise credentials_exception from e

        logger.debug("Looking up user by email=%s", username)
        try:
            result = await db.execute(select(User).where(User.email == username))
            user = result.scalar_one_or_none()
            logger.debug("User lookup result: %s", getattr(user, 'email', None))
        except Exception as e:
            logger.exception("Database error during user lookup: %s", e)
            raise credentials_exception from e
        
        if user is None:
            logger.warning("Authentication failed: user not found for email=%s", username)
            raise credentials_exception
        
        logger.debug("User authenticated successfully: %s", username)
        
        # Helper to safely convert role/persona to Enum
        try:
            role_val = user.role
            if not isinstance(role_val, UserRole):
                try:
                    role_val = UserRole(role_val)
                except ValueError:
                    logger.error(f"Invalid role in DB: {role_val}")
                    # Fallback to APPRENTICE to prevent 500 error
                    role_val = UserRole.APPRENTICE
            
            persona_val = user.persona
            # Handle empty string or None
            if not persona_val:
                persona_val = None
            elif not isinstance(persona_val, UserPersona):
                try:
                    persona_val = UserPersona(persona_val)
                except ValueError:
                    # Fallback if DB has invalid enum value
                    logger.warning(f"Invalid persona value in DB: {persona_val}")
                    persona_val = None

            cached_user = CachedUser(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                username=user.username,
                role=role_val,
                persona=persona_val,
                experience_level=user.experience_level,
                primary_goal=user.primary_goal,
                industry=user.industry,
                opportunity_preference=user.opportunity_preference,
                years_experience=user.years_experience,
                province=user.province,
                city=user.city,
                willing_to_relocate=user.willing_to_relocate,
                career_intent=user.career_intent,
                available_from=user.available_from,
                notice_period_weeks=user.notice_period_weeks,
                salary_expectation_min=user.salary_expectation_min,
                salary_expectation_max=user.salary_expectation_max,
                salary_negotiable=user.salary_negotiable,
                work_mode_preference=user.work_mode_preference,
                max_commute_minutes=user.max_commute_minutes,
                is_active=user.is_active,
                created_at=user.created_at,
            )
            _token_cache[token] = (cached_user, now + _CACHE_TTL_SECONDS)
            return replace(cached_user)
        except Exception as e:
            import traceback
            logger.error(f"Error in get_current_user: {e}\n{traceback.format_exc()}")
            raise

async def get_current_active_user(
    current_user: CachedUser = Depends(get_current_user)
) -> CachedUser:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


from fastapi import Request, Cookie
from typing import Optional

async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(None)
) -> Optional[CachedUser]:
    """
    Get current user if authenticated, otherwise return None.
    Does not raise 401 for unauthenticated requests.
    """
    # Try to get token from cookie or Authorization header
    token = access_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        return None
    
    try:
        # Re-use the existing get_current_user logic but catch exceptions
        payload = security.decode_access_token(token)
        username = payload.get("sub")
        if not username:
            return None
        
        result = await db.execute(select(User).where(User.email == username))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            return None
        
        # Helper to safely convert role/persona to Enum
        role_val = user.role
        if not isinstance(role_val, UserRole):
            try:
                role_val = UserRole(role_val)
            except ValueError:
                role_val = UserRole.APPRENTICE
        
        persona_val = user.persona
        if not persona_val:
            persona_val = None
        elif not isinstance(persona_val, UserPersona):
            try:
                persona_val = UserPersona(persona_val)
            except ValueError:
                persona_val = None
        
        return CachedUser(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            username=user.username,
            role=role_val,
            persona=persona_val,
            experience_level=user.experience_level,
            primary_goal=user.primary_goal,
            industry=user.industry,
            opportunity_preference=user.opportunity_preference,
            years_experience=user.years_experience,
            province=user.province,
            city=user.city,
            willing_to_relocate=user.willing_to_relocate,
            career_intent=user.career_intent,
            available_from=user.available_from,
            notice_period_weeks=user.notice_period_weeks,
            salary_expectation_min=user.salary_expectation_min,
            salary_expectation_max=user.salary_expectation_max,
            salary_negotiable=user.salary_negotiable,
            work_mode_preference=user.work_mode_preference,
            max_commute_minutes=user.max_commute_minutes,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except Exception:
        # Any error means not authenticated
        return None