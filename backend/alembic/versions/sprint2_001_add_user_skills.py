"""add user skills column

Revision ID: sprint2_001
Revises: 1a5e4dae1c7a
Create Date: 2025-12-05 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'sprint2_001'
down_revision = 'f36495f1864e'
branch_labels = None
depends_on = None


def upgrade():
    # Add skills column to users table
    op.add_column('users', sa.Column('skills', sa.Text(), nullable=True))


def downgrade():
    # Remove skills column from users table
    op.drop_column('users', 'skills')
