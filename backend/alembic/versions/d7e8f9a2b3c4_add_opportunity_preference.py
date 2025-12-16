"""Add opportunity_preference to users

Revision ID: d7e8f9a2b3c4
Revises: c5d8e9a1b2f3
Create Date: 2024-12-16

Adds opportunity_preference column to users table for category-based personalization.
Values: 'jobs', 'training_skills_programs', 'both'
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd7e8f9a2b3c4'
down_revision = 'c5d8e9a1b2f3'
branch_labels = None
depends_on = None


def upgrade():
    """Add opportunity_preference column to users table."""
    op.add_column(
        'users',
        sa.Column('opportunity_preference', sa.String(), nullable=True)
    )


def downgrade():
    """Remove opportunity_preference column from users table."""
    op.drop_column('users', 'opportunity_preference')
