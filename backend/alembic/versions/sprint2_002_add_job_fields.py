"""add job matching fields

Revision ID: sprint2_002
Revises: sprint2_001
Create Date: 2025-12-05 19:46:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'sprint2_002'
down_revision = 'sprint2_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to jobs table for advanced matching
    op.add_column('jobs', sa.Column('job_type', sa.String(100), nullable=True))
    op.add_column('jobs', sa.Column('required_skills', sa.Text(), nullable=True))
    op.add_column('jobs', sa.Column('experience_level', sa.String(50), nullable=True))
    op.add_column('jobs', sa.Column('industry', sa.String(100), nullable=True))
    op.add_column('jobs', sa.Column('salary_range', sa.String(100), nullable=True))


def downgrade():
    # Remove the columns from jobs table
    op.drop_column('jobs', 'salary_range')
    op.drop_column('jobs', 'industry')
    op.drop_column('jobs', 'experience_level')
    op.drop_column('jobs', 'required_skills')
    op.drop_column('jobs', 'job_type')
