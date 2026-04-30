"""Add ingest-specific opportunity fields

Revision ID: sprint4_002
Revises: sprint4_001
Create Date: 2026-04-28

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "sprint4_002"
down_revision = "sprint4_001"
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

    new_cols = {
        "source_url": "TEXT",
        "source_platform": "VARCHAR(50)",
        "trust_score": "FLOAT",
        "ai_status": "VARCHAR(20)",
        "ai_confidence_score": "FLOAT",
        "application_deadline_date": "DATE",
        "contact_email": "VARCHAR(255)",
        "contact_phone": "VARCHAR(50)",
        "application_url": "TEXT",
    }

    for col, col_type in new_cols.items():
        if col not in existing:
            op.execute(sa.text(
                f"ALTER TABLE opportunities ADD COLUMN {col} {col_type}"
            ))

    index_exists = conn.execute(sa.text(
        "SELECT EXISTS ("
        "  SELECT 1 FROM pg_indexes "
        "  WHERE schemaname = ANY(current_schemas(false)) "
        "    AND tablename = 'opportunities' "
        "    AND indexname = 'ix_opportunities_source_url'"
        ")"
    )).scalar()
    if not index_exists:
        op.create_index(
            "ix_opportunities_source_url",
            "opportunities",
            ["source_url"],
            unique=True,
        )


def downgrade():
    op.drop_index("ix_opportunities_source_url", table_name="opportunities")

    for col in [
        "application_url",
        "contact_phone",
        "contact_email",
        "application_deadline_date",
        "ai_confidence_score",
        "ai_status",
        "trust_score",
        "source_platform",
        "source_url",
    ]:
        op.execute(sa.text(f"ALTER TABLE opportunities DROP COLUMN IF EXISTS {col}"))