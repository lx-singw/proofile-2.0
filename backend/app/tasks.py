from app.celery_app import celery_app
import time
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core import broadcaster
from sqlalchemy import select
import asyncio
import os
from typing import Optional
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:
    boto3 = None


@celery_app.task
def parse_resume_task(resume_id: str):
    """Celery wrapper for synchronous worker executors."""
    # Resume functionality has been removed - this is a no-op
    pass


async def parse_resume_task_async(resume_id: str):
    """Async implementation of parsing a resume. Resume functionality has been removed."""
    # This is a no-op since resume functionality is no longer available
    pass


@celery_app.task
def generate_pdf_task(resume_id: str, template_id: str):
    """Celery wrapper: run async implementation in a fresh event loop."""
    # Resume functionality has been removed - this is a no-op
    pass


async def generate_pdf_task_async(resume_id: str, template_id: str):
    """Async implementation for PDF generation. Resume functionality has been removed."""
    # This is a no-op since resume functionality is no longer available
    return {"status": "no_op"}
