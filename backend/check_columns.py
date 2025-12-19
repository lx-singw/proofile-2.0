import asyncio
import os
import sys
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_users():
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
            columns = [row[0] for row in result.all()]
            print("COLUMNS:" + ",".join(columns))
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_users())
