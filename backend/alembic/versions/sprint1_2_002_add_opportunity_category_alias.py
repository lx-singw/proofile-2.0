"""Add opportunity_category alias column for ORM compatibility

Revision ID: sprint1_2_002
Revises: sprint1_2_001
Create Date: 2026-05-17

"""
from alembic import op
import sqlalchemy as sa

revision = "sprint1_2_002"
down_revision = "sprint1_2_001"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    existing = {
        row[0]
        for row in conn.execute(sa.text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunities'"
        ))
    }

    if "opportunity_category" not in existing:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN opportunity_category VARCHAR(50) DEFAULT 'jobs'"
        ))
        op.execute(sa.text(
            "UPDATE opportunities SET opportunity_category = COALESCE(category, 'jobs')"
        ))

    existing_indexes = {
        row[0]
        for row in conn.execute(sa.text(
            "SELECT indexname FROM pg_indexes WHERE tablename = 'opportunities'"
        ))
    }

    if "ix_opportunities_opportunity_category" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_opportunity_category",
                "opportunities",
                ["opportunity_category"],
            )
        except Exception:
            pass


def downgrade():
    try:
        op.drop_index("ix_opportunities_opportunity_category", "opportunities")
    except Exception:
        pass
    op.execute(sa.text("ALTER TABLE opportunities DROP COLUMN IF EXISTS opportunity_category"))
