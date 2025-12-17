"""
Add opportunity_category and opportunity_type columns to portal_jobs

Revision ID: f1a2b3c4d5e7
Revises: e1a2b3c4d5e6
Create Date: 2024-12-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = 'f1a2b3c4d5e7'
down_revision = 'e1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # Check if portal_jobs table exists
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()
    
    if 'portal_jobs' not in tables:
        # Table doesn't exist yet, skip this migration
        # It will be handled when the table is created
        print("portal_jobs table does not exist, skipping opportunity columns")
        return
    
    # Check if columns already exist
    columns = [col['name'] for col in inspector.get_columns('portal_jobs')]
    
    if 'opportunity_category' not in columns:
        op.add_column('portal_jobs', 
            sa.Column('opportunity_category', sa.String(50), nullable=True))
        op.create_index(
            'ix_portal_jobs_opportunity_category', 
            'portal_jobs', 
            ['opportunity_category']
        )
    
    if 'opportunity_type' not in columns:
        op.add_column('portal_jobs', 
            sa.Column('opportunity_type', sa.String(50), nullable=True))
        op.create_index(
            'ix_portal_jobs_opportunity_type', 
            'portal_jobs', 
            ['opportunity_type']
        )
    
    # Set defaults for existing jobs (only if we added columns)
    if 'opportunity_category' not in columns or 'opportunity_type' not in columns:
        op.execute("""
            UPDATE portal_jobs 
            SET opportunity_category = 'jobs', 
                opportunity_type = 'employment'
            WHERE opportunity_category IS NULL
        """)


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()
    
    if 'portal_jobs' not in tables:
        return
    
    columns = [col['name'] for col in inspector.get_columns('portal_jobs')]
    
    if 'opportunity_type' in columns:
        op.drop_index('ix_portal_jobs_opportunity_type', table_name='portal_jobs')
        op.drop_column('portal_jobs', 'opportunity_type')
    
    if 'opportunity_category' in columns:
        op.drop_index('ix_portal_jobs_opportunity_category', table_name='portal_jobs')
        op.drop_column('portal_jobs', 'opportunity_category')
