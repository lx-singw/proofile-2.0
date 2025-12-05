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
        db.add(db_user)
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
        import traceback
        logging.getLogger(__name__).error(f"User creation failed: {e}\n{traceback.format_exc()}")
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

    # Handle persona separately to ensure proper conversion
    if "persona" in update_data:
        persona_value = update_data.pop("persona")
        if persona_value is not None:
            import enum as _enum
            if isinstance(persona_value, _enum.Enum):
                persona_str = persona_value.value
            else:
                persona_str = str(persona_value)
        else:
            persona_str = None
        
        # Set attribute directly so SQLAlchemy tracks the change
        user.persona = persona_str

    # Update remaining fields
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