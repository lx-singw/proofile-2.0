"""Seed a deterministic dev user into the application's database.

Run this script inside the backend container:
    docker-compose exec backend poetry run python scripts/seed_dev_user.py

Creates (or resets the password of) dev@example.com with password DevPass1!
so local development logins always work after a fresh database.
"""
import asyncio
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.services import user_service
from app.schemas.user import UserCreate


DEV_EMAIL = "dev@example.com"
DEV_PASSWORD = "DevPass1!"
DEV_FULL_NAME = "Dev User"


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = await user_service.get_user_by_email(session, DEV_EMAIL)

        if existing:
            # Reset the password so it always matches the documented value,
            # even if a previous run or manual DB edit changed it.
            new_hash = get_password_hash(DEV_PASSWORD)
            await session.execute(
                text("UPDATE users SET hashed_password = :h WHERE id = :id"),
                {"h": new_hash, "id": existing.id},
            )
            await session.commit()
            print(f"Dev user {DEV_EMAIL} already exists (id={existing.id}) — password reset to DevPass1!")
        else:
            user_in = UserCreate(
                email=DEV_EMAIL,
                password=DEV_PASSWORD,
                full_name=DEV_FULL_NAME,
            )
            user = await user_service.create_user(session, user_in)
            print(f"Created dev user {user.email} with id={user.id}")


if __name__ == "__main__":
    asyncio.run(main())
