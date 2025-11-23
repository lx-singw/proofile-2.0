"""
Service layer for user-related operations.

This encapsulates the business logic for creating, retrieving,
and managing users, separating it from the API endpoints.
"""
import logging
import traceback
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """
    Retrieve a user from the database by their email address.
    """
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """
    Retrieve a user from the database by their ID.
    """
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """
    Create a new user in the database.

    - Hashes the password before storing.
    - Creates a new User model instance.
    - Adds it to the session and commits.
    - Refreshes the instance to get the ID and other defaults from the DB.
    """
    hashed_password = get_password_hash(user_in.password)
    # Ensure role is stored as a plain string to avoid DB enum type mismatches
    role_value = None
    try:
        import enum as _enum
        if isinstance(user_in.role, _enum.Enum):
            role_value = user_in.role.value
        else:
            role_value = str(user_in.role) if user_in.role is not None else None
    except Exception:
        role_value = str(user_in.role) if user_in.role is not None else None

    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=role_value,
    )
    try:
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        search_path = await db.execute(text("SHOW search_path"))
        print("DEBUG: search_path:", search_path.scalar(), flush=True)
        current_db = await db.execute(text("SELECT current_database()"))
        print("DEBUG: current_db:", current_db.scalar(), flush=True)
        tables = await db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'"))
        print("DEBUG: users table exists:", tables.scalar() is not None, flush=True)
        db.add(db_user)
        await db.execute(text("SET search_path TO public"))
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError:
        await db.rollback()
        raise
    except ValueError:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        try:
            search_path = await db.execute(text("SHOW search_path"))
            logging.getLogger(__name__).error("Current search_path: %s", search_path.scalar())
        except Exception:
            logging.getLogger(__name__).exception("Failed to inspect search_path after user create error")
        # Log the full exception and traceback at ERROR so it appears in container logs
        logging.getLogger(__name__).exception("User creation failed: %s", repr(e))
        # Also print to stdout for immediate visibility in non-logged environments
        print("USER_CREATE_ERR:", repr(e), flush=True)
        print("USER_CREATE_TRACE:\n", traceback.format_exc(), flush=True)
        raise RuntimeError(f"Failed to create user: {e}") from e
 
async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    """
    Update a user's details.
    """
    update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        user.hashed_password = hashed_password

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError:
        await db.rollback()
        raise
    except ValueError:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise RuntimeError(f"Failed to update user: {e}") from e