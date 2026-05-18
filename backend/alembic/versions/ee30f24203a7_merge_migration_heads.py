"""merge_migration_heads

Revision ID: ee30f24203a7
Revises: 50303bdaea3f, mvp_001
Create Date: 2026-05-16 16:06:05.904798

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ee30f24203a7'
down_revision = ('50303bdaea3f', 'mvp_001')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
