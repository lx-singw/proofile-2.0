"""Add missing category column to opportunities

Revision ID: sprint4_003
Revises: sprint4_002
Create Date: 2026-04-28

"""
from alembic import op
import sqlalchemy as sa


revision = "sprint4_003"
down_revision = "sprint4_002"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    existing = {
        row[0]
        for row in conn.execute(sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'opportunities'"
        ))
    }

    if "category" not in existing:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN category VARCHAR(50) DEFAULT 'jobs'"
        ))


def downgrade():
    op.execute(sa.text("ALTER TABLE opportunities DROP COLUMN IF EXISTS category"))