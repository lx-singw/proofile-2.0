"""
API Endpoints for Users.
"""
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.api.v1 import deps
from app.services import user_service, profile_service
from app.models.user import UserRole
from sqlalchemy import text
import logging

router = APIRouter()


def _is_admin(role) -> bool:
    if isinstance(role, UserRole):
        return role == UserRole.ADMIN
    if isinstance(role, str):
        return role.lower() == UserRole.ADMIN.value
    return False

async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
):
    """
    Create a new user.
    """
    try:
        # Sanitize incoming data: do not allow clients to set the role at registration.
        user_data = user_in.model_dump()
        user_data.pop("role", None)
        sanitized = schemas.UserCreate(**user_data)
        # Extra debug: attempt raw INSERT via SQL to observe exact DB error in this HTTP request context
        try:
            # Use a parameterized insert; let SQLAlchemy handle enum type
            await db.execute(
                text(
                    "INSERT INTO users (email, hashed_password, full_name, role, is_active, created_at, updated_at) VALUES (:email, :hp, :fn, :role, :is_active, now(), now())"
                ),
                {
                    "email": sanitized.email,
                    "hp": "__debug_dummy__",
                    "fn": sanitized.full_name or "",
                    "role": sanitized.role.value if hasattr(sanitized.role, 'value') else sanitized.role,
                    "is_active": True,
                },
            )
            await db.rollback()
            print("[DEBUG] raw insert executed (rolled back)", flush=True)
        except Exception as raw_e:
            import traceback
            print("[DEBUG] raw insert error:", repr(raw_e), flush=True)
            traceback.print_exc()
        user = await user_service.create_user(db=db, user_in=sanitized)
        return user
    except IntegrityError:
        # This will be caught if the email already exists due to the unique constraint.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

@router.post("", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_in: schemas.UserCreate, db: AsyncSession = Depends(deps.get_db)
):
    """
    Create a new user.
    """
    try:
        # Debug: log current search_path and whether 'users' is present in pg_tables
        try:
            sp = await db.execute(text("SHOW search_path"))
            print("[DEBUG] search_path before insert:", sp.scalar(), flush=True)
            tbl = await db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename='users'"))
            print("[DEBUG] users present in current_schema():", tbl.scalar(), flush=True)
            current_db = await db.execute(text("SELECT current_database()"))
            print("[DEBUG] current_database:", current_db.scalar(), flush=True)
        except Exception as e:
            print("[DEBUG] Failed to log debug DB info:", repr(e), flush=True)
        user_data = user_in.model_dump()
        user_data.pop("role", None)
        sanitized = schemas.UserCreate(**user_data)
        user = await user_service.create_user(db=db, user_in=sanitized)
        return user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logging.getLogger(__name__).exception("User creation failed: %s", e)
        await db.rollback()
        # Return full traceback in response temporarily for debugging
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DEBUG: {repr(e)}\n{tb}",
        )

@router.get("/me", response_model=schemas.UserRead)
async def read_current_user(current_user = Depends(deps.get_current_active_user)):
    """Return the currently authenticated user's details.

    This provides a stable /api/v1/users/me endpoint for frontend authService probes.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": None,
    }

@router.patch("/{user_id}", response_model=schemas.UserRead)
async def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update a user's details. Only accessible by admins.
    """
    if not _is_admin(getattr(current_user, "role", None)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )

    user = await user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    try:
        updated_user = await user_service.update_user(db, user=user, user_in=user_in)
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        ) from e