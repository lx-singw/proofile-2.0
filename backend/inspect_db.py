import asyncio
import sys
import os

# Create a dummy module for 'app' so we can import models without full app context if needed
# But better to just use the existing app structure
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.project_collaborator import ProjectCollaborator
from app.models.notification import Notification
from app.models.user import User
from sqlalchemy import select, text

async def check_db():
    async with AsyncSessionLocal() as session:
        print("--- Tables ---")
        result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in result.all()]
        print(tables)
        
        if "notifications" not in tables:
            print("!!! notifications table is MISSING !!!")

        print("\n--- Peer Verification Requests ---")
        print("Checking tables...")
        result = await session.execute(text("SELECT to_regclass('public.peer_verification_requests')"))
        exists = result.scalar()
        print(f"Table 'peer_verification_requests' exists: {exists is not None}")
        
        if exists:
            print("Checking records...")
            result = await session.execute(text("SELECT count(*) FROM peer_verification_requests"))
            print(f"Record count: {result.scalar()}")
        else:
            print("!!! peer_verification_requests table is MISSING !!!")

        print("--- Project Collaborators ---")
        try:
            result = await session.execute(select(ProjectCollaborator))
            collabs = result.scalars().all()
            for c in collabs:
                print(f"ID: {c.id}, Project: {c.project_name}, Status: {c.status}, Req: {c.requester_id}, Collab: {c.collaborator_id}")
            
            if not collabs:
                print("No project collaborators found.")
        except Exception as e:
            print(f"Error querying ProjectCollaborator: {e}")

        print("\n--- Notifications ---")
        try:
            result = await session.execute(select(Notification))
            notifs = result.scalars().all()
            for n in notifs:
                print(f"ID: {n.id}, To: {n.user_id}, Title: {n.title}, Read: {n.read}")
                
            if not notifs:
                print("No notifications found.")
        except Exception as e:
            print(f"Error querying Notification: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
