"""Merge migration heads

Revision ID: merge_sprint1_2
Revises: 933b2a9dede6, sprint1_2_002
Create Date: 2026-05-17 13:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_sprint1_2'
down_revision = ('933b2a9dede6', 'sprint1_2_002')
branch_labels = None
depends_on = None


def upgrade():
    # No schema changes needed - just merging heads
    pass


def downgrade():
    # No schema changes needed - just merging heads
    pass
