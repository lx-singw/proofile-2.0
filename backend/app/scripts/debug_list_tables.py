import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal

async def list_tables():
    from sqlalchemy import text
    import traceback
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public';"))
        tables = result.fetchall()
        print("Tables in public schema:")
        for row in tables:
            print(row[0])

        print("\n[DEBUG] Attempting direct insert into users table...")
        try:
            await session.execute(
                text(
                    "INSERT INTO users (email, hashed_password, full_name, role, is_active, created_at, updated_at) VALUES (:email, :hp, :fn, :role, :is_active, now(), now())"
                ),
                {
                    "email": "debuguser@example.com",
                    "hp": "debugpassword",
                    "fn": "Debug User",
                    "role": "apprentice",
                    "is_active": True,
                },
            )
            await session.commit()
            print("[DEBUG] Direct insert succeeded.")
        except Exception as e:
            print("[DEBUG] Direct insert error:", repr(e))
            print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(list_tables())
