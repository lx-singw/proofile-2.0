"""Rename jobs to opportunities

Revision ID: c5d8e9a1b2f3
Revises: sprint3_001_social_models
Create Date: 2024-12-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c5d8e9a1b2f3'
down_revision = 'sprint3_001_social_models'
branch_labels = None
depends_on = None


def upgrade():
    """Rename jobs tables to opportunities tables."""
    
    # Rename jobs table to opportunities
    op.rename_table('jobs', 'opportunities')
    
    # Rename saved_jobs table to saved_opportunities
    op.rename_table('saved_jobs', 'saved_opportunities')
    
    # Rename portal_jobs table to portal_opportunities
    op.rename_table('portal_jobs', 'portal_opportunities')
    
    # Update foreign key in saved_opportunities (job_id -> opportunity_id)
    # Note: We keep the column name as job_id for now to avoid breaking changes
    # A future migration can rename the column
    
    # Update indexes for portal_opportunities
    # Drop old indexes and create new ones with updated names
    op.execute("ALTER INDEX IF EXISTS ix_portal_jobs_search RENAME TO ix_portal_opportunities_search")
    op.execute("ALTER INDEX IF EXISTS ix_portal_jobs_filter RENAME TO ix_portal_opportunities_filter")
    op.execute("ALTER INDEX IF EXISTS ix_portal_jobs_active_posted RENAME TO ix_portal_opportunities_active_posted")
    op.execute("ALTER INDEX IF EXISTS ix_jobs_title RENAME TO ix_opportunities_title")
    op.execute("ALTER INDEX IF EXISTS ix_jobs_employer_id RENAME TO ix_opportunities_employer_id")


def downgrade():
    """Revert: Rename opportunities tables back to jobs tables."""
    
    # Revert index renames
    op.execute("ALTER INDEX IF EXISTS ix_portal_opportunities_search RENAME TO ix_portal_jobs_search")
    op.execute("ALTER INDEX IF EXISTS ix_portal_opportunities_filter RENAME TO ix_portal_jobs_filter")
    op.execute("ALTER INDEX IF EXISTS ix_portal_opportunities_active_posted RENAME TO ix_portal_jobs_active_posted")
    op.execute("ALTER INDEX IF EXISTS ix_opportunities_title RENAME TO ix_jobs_title")
    op.execute("ALTER INDEX IF EXISTS ix_opportunities_employer_id RENAME TO ix_jobs_employer_id")
    
    # Rename tables back
    op.rename_table('opportunities', 'jobs')
    op.rename_table('saved_opportunities', 'saved_jobs')
    op.rename_table('portal_opportunities', 'portal_jobs')
