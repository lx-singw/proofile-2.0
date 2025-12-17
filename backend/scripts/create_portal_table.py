"""
Create Portal Jobs Table

Quick script to create the portal_jobs table if it doesn't exist.
Run with: python -m scripts.create_portal_table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import sync_engine
from app.models.portal_job import PortalJob

print("Creating portal_jobs table...")
PortalJob.metadata.create_all(sync_engine)
print("Done!")
