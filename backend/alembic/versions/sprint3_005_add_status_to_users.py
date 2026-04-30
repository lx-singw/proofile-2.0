"""add status column to users

Revision ID: sprint3_005
Revises: sprint3_004
Create Date: 2026-04-26 07:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'sprint3_005'
down_revision = 'sprint3_004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('status', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'status')
