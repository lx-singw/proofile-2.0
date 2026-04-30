"""Add feed-specific fields to opportunities; create feed_signals and user_feed_state tables

Revision ID: sprint4_001
Revises: sprint3_005_add_status_to_users
Create Date: 2026-04-27

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'sprint4_001'
down_revision = 'sprint3_005'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ── 1. Extend opportunities table ────────────────────────────────────────
    # Only add columns that don't already exist (idempotent)
    existing = {
        row[0]
        for row in conn.execute(sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'opportunities'"
        ))
    }

    new_cols = {
        "source":         "VARCHAR(50)",
        "source_id":      "VARCHAR(255)",
        "remote_type":    "VARCHAR(20)",
        "salary_min":     "INTEGER",
        "salary_max":     "INTEGER",
        "salary_visible": "BOOLEAN DEFAULT TRUE",
        "quality_score":  "FLOAT DEFAULT 0.5",
        "engagement_rate":"FLOAT DEFAULT 0.0",
        "posted_at":      "TIMESTAMP WITHOUT TIME ZONE",
        "expires_at":     "TIMESTAMP WITHOUT TIME ZONE",
        "is_direct":      "BOOLEAN DEFAULT FALSE",
    }

    for col, col_type in new_cols.items():
        if col not in existing:
            op.execute(sa.text(
                f"ALTER TABLE opportunities ADD COLUMN {col} {col_type}"
            ))

    # Make employer_id nullable (aggregated listings have no employer)
    op.execute(sa.text(
        "ALTER TABLE opportunities ALTER COLUMN employer_id DROP NOT NULL"
    ))

    # Index on source for deduplication lookups
    try:
        op.create_index("ix_opportunities_source", "opportunities", ["source"])
    except Exception:
        pass

    # ── 2. Create feed_signals table ─────────────────────────────────────────
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feed_signals')"
    ))
    if not result.scalar():
        op.create_table(
            "feed_signals",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("session_id", sa.String(128), nullable=False, index=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("opportunity_id", sa.Integer, sa.ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("card_type", sa.String(50), nullable=False),
            sa.Column("signal_type", sa.String(50), nullable=False),
            sa.Column("feed_position", sa.Integer, nullable=True),
            sa.Column("session_duration_ms", sa.Integer, nullable=True),
            sa.Column("timestamp", sa.DateTime, nullable=False),
        )

    # ── 3. Create user_feed_state table ──────────────────────────────────────
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_feed_state')"
    ))
    if not result.scalar():
        op.create_table(
            "user_feed_state",
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("last_seen_cursor", sa.String(255), nullable=True),
            sa.Column("dismissed_ids", sa.Text, nullable=True),
            sa.Column("saved_ids", sa.Text, nullable=True),
            sa.Column("inferred_roles", sa.Text, nullable=True),
            sa.Column("inferred_salary_min", sa.Integer, nullable=True),
            sa.Column("inferred_salary_max", sa.Integer, nullable=True),
            sa.Column("inferred_location", sa.String(255), nullable=True),
            sa.Column("feed_version", sa.Integer, default=1),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        )


def downgrade():
    op.drop_table("user_feed_state")
    op.drop_table("feed_signals")

    for col in [
        "source", "source_id", "remote_type",
        "salary_min", "salary_max", "salary_visible",
        "quality_score", "engagement_rate",
        "posted_at", "expires_at", "is_direct",
    ]:
        op.execute(sa.text(f"ALTER TABLE opportunities DROP COLUMN IF EXISTS {col}"))
