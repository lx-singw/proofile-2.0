"""Rename jobs tables to opportunities

This migration renames the legacy 'jobs' tables to 'opportunities' tables
to complete the Jobs-to-Opportunities transformation.

Revision ID: sprint3_003
Revises: sprint3_002_user_personalization_dimensions
Create Date: 2025-12-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'sprint3_003'
down_revision = ('sprint3_002', 'a73a461453b4')  # Merge migration
branch_labels = None
depends_on = None


def upgrade():
    """
    Rename jobs tables to opportunities.
    This is a safe operation that preserves all data.
    """
    conn = op.get_bind()
    
    # Check if 'jobs' table exists before renaming
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'jobs')"
    ))
    jobs_exists = result.scalar()
    
    if jobs_exists:
        # Rename main jobs table
        op.rename_table('jobs', 'opportunities')
        
        # Rename indexes
        try:
            op.execute('ALTER INDEX IF EXISTS ix_jobs_user_id RENAME TO ix_opportunities_user_id')
            op.execute('ALTER INDEX IF EXISTS ix_jobs_employer_id RENAME TO ix_opportunities_employer_id')
            op.execute('ALTER INDEX IF EXISTS ix_jobs_title RENAME TO ix_opportunities_title')
        except Exception as e:
            print(f"Index rename warning (may not exist): {e}")
    
    # Check if 'saved_jobs' table exists before renaming
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_jobs')"
    ))
    saved_jobs_exists = result.scalar()
    
    if saved_jobs_exists:
        # Rename saved_jobs table
        op.rename_table('saved_jobs', 'saved_opportunities')
        
        # Rename indexes
        try:
            op.execute('ALTER INDEX IF EXISTS ix_saved_jobs_user_id RENAME TO ix_saved_opportunities_user_id')
            op.execute('ALTER INDEX IF EXISTS ix_saved_jobs_job_id RENAME TO ix_saved_opportunities_opportunity_id')
        except Exception as e:
            print(f"Index rename warning (may not exist): {e}")
        
        # Rename column from job_id to opportunity_id
        try:
            op.alter_column('saved_opportunities', 'job_id', new_column_name='opportunity_id')
        except Exception as e:
            print(f"Column rename warning (may already be renamed): {e}")
        
        # Rename constraint
        try:
            op.execute('ALTER TABLE saved_opportunities RENAME CONSTRAINT unique_user_job TO unique_user_opportunity')
        except Exception as e:
            print(f"Constraint rename warning (may not exist): {e}")
    
    # Check if 'portal_jobs' table exists before renaming
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portal_jobs')"
    ))
    portal_jobs_exists = result.scalar()
    
    if portal_jobs_exists:
        # Rename portal_jobs table
        op.rename_table('portal_jobs', 'portal_opportunities')
        
        # Rename indexes
        try:
            op.execute('ALTER INDEX IF EXISTS ix_portal_jobs_search RENAME TO ix_portal_opportunities_search')
            op.execute('ALTER INDEX IF EXISTS ix_portal_jobs_filter RENAME TO ix_portal_opportunities_filter')
            op.execute('ALTER INDEX IF EXISTS ix_portal_jobs_active_posted RENAME TO ix_portal_opportunities_active_posted')
            op.execute('ALTER INDEX IF EXISTS ix_portal_jobs_title RENAME TO ix_portal_opportunities_title')
            op.execute('ALTER INDEX IF EXISTS ix_portal_jobs_company RENAME TO ix_portal_opportunities_company')
            op.execute('ALTER INDEX IF EXISTS ix_portal_jobs_source RENAME TO ix_portal_opportunities_source')
        except Exception as e:
            print(f"Index rename warning (may not exist): {e}")


def downgrade():
    """
    Revert to jobs tables if needed.
    """
    conn = op.get_bind()
    
    # Check if 'opportunities' table exists before reverting
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunities')"
    ))
    opportunities_exists = result.scalar()
    
    if opportunities_exists:
        op.rename_table('opportunities', 'jobs')
        try:
            op.execute('ALTER INDEX IF EXISTS ix_opportunities_user_id RENAME TO ix_jobs_user_id')
            op.execute('ALTER INDEX IF EXISTS ix_opportunities_employer_id RENAME TO ix_jobs_employer_id')
        except Exception:
            pass
    
    # Check if 'saved_opportunities' exists
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_opportunities')"
    ))
    saved_opportunities_exists = result.scalar()
    
    if saved_opportunities_exists:
        op.rename_table('saved_opportunities', 'saved_jobs')
        try:
            op.alter_column('saved_jobs', 'opportunity_id', new_column_name='job_id')
            op.execute('ALTER TABLE saved_jobs RENAME CONSTRAINT unique_user_opportunity TO unique_user_job')
        except Exception:
            pass
    
    # Check if 'portal_opportunities' exists
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portal_opportunities')"
    ))
    portal_opportunities_exists = result.scalar()
    
    if portal_opportunities_exists:
        op.rename_table('portal_opportunities', 'portal_jobs')
