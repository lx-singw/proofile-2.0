"""
Add opportunity_category and opportunity_type columns to portal_jobs

Revision ID: f1a2b3c4d5e7
Revises: e1a2b3c4d5e6
Create Date: 2024-12-17
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'f1a2b3c4d5e7'
down_revision = 'e1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # Add opportunity classification columns
    op.add_column('portal_jobs', 
        sa.Column('opportunity_category', sa.String(50), nullable=True))
    op.add_column('portal_jobs', 
        sa.Column('opportunity_type', sa.String(50), nullable=True))
    
    # Create indexes for efficient filtering
    op.create_index(
        'ix_portal_jobs_opportunity_category', 
        'portal_jobs', 
        ['opportunity_category']
    )
    op.create_index(
        'ix_portal_jobs_opportunity_type', 
        'portal_jobs', 
        ['opportunity_type']
    )
    
    # Set defaults for existing jobs
    op.execute("""
        UPDATE portal_jobs 
        SET opportunity_category = 'jobs', 
            opportunity_type = 'employment'
        WHERE opportunity_category IS NULL
    """)


def downgrade():
    op.drop_index('ix_portal_jobs_opportunity_type', table_name='portal_jobs')
    op.drop_index('ix_portal_jobs_opportunity_category', table_name='portal_jobs')
    op.drop_column('portal_jobs', 'opportunity_type')
    op.drop_column('portal_jobs', 'opportunity_category')
