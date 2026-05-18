"""Add performance indexes for feed queries and pipeline processing

Revision ID: sprint1_2_001
Revises: sprint5_001
Create Date: 2026-05-17

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'sprint1_2_001'
down_revision = 'sprint5_001'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    existing_cols = {
        row[0]
        for row in conn.execute(sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'opportunities'"
        ))
    }

    if "is_active" not in existing_cols:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN is_active BOOLEAN DEFAULT TRUE"
        ))

    if "is_duplicate_of" not in existing_cols:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN is_duplicate_of INTEGER"
        ))

    if "required_skills" not in existing_cols:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN required_skills TEXT"
        ))

    if "city" not in existing_cols:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN city VARCHAR(100)"
        ))

    if "province" not in existing_cols:
        op.execute(sa.text(
            "ALTER TABLE opportunities ADD COLUMN province VARCHAR(100)"
        ))

    # Check existing indexes to avoid duplicates
    existing_indexes = {
        row[0]
        for row in conn.execute(sa.text(
            "SELECT indexname FROM pg_indexes WHERE tablename = 'opportunities'"
        ))
    }

    # ── 1. Index for source_id deduplication lookups ─────────────────────────
    if "ix_opportunities_source_id" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_source_id",
                "opportunities",
                ["source_id"],
                unique=False,
            )
        except Exception:
            pass

    # ── 2. Composite index for feed ranking query ────────────────────────────
    # The feed query filters on: is_active=True, quality_score >= 0.4, expires_at > now
    # This composite index covers the most selective columns first
    if "ix_opportunities_feed_ranking" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_feed_ranking",
                "opportunities",
                ["is_active", "quality_score", "expires_at"],
            )
        except Exception:
            pass

    # ── 3. Index for quality score filtering ───────────────────────────────
    if "ix_opportunities_quality_score" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_quality_score",
                "opportunities",
                ["quality_score"],
            )
        except Exception:
            pass

    # ── 4. Index for posted_at freshness sorting ─────────────────────────────
    if "ix_opportunities_posted_at" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_posted_at",
                "opportunities",
                ["posted_at"],
            )
        except Exception:
            pass

    # ── 5. Index for source filtering in pipeline processing ─────────────────
    if "ix_opportunities_source_created" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_source_created",
                "opportunities",
                ["source", "created_at"],
            )
        except Exception:
            pass

    # ── 6. Index for opportunity type filtering ──────────────────────────────
    if "ix_opportunities_opportunity_type" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_opportunity_type",
                "opportunities",
                ["job_type"],
            )
        except Exception:
            pass

    # ── 7. Index for city/location filtering ─────────────────────────────────
    if "ix_opportunities_city" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_city",
                "opportunities",
                ["city"],
            )
        except Exception:
            pass

    # ── 8. Composite index for is_duplicate_of ───────────────────────────────
    # Pipeline queries filter on is_duplicate_of IS NULL
    if "ix_opportunities_is_duplicate" not in existing_indexes:
        try:
            op.create_index(
                "ix_opportunities_is_duplicate",
                "opportunities",
                ["is_duplicate_of"],
                postgresql_where=sa.text("is_duplicate_of IS NULL"),
            )
        except Exception:
            pass

def downgrade():
    # Drop indexes
    for idx in [
        "ix_opportunities_source_id",
        "ix_opportunities_feed_ranking",
        "ix_opportunities_quality_score",
        "ix_opportunities_posted_at",
        "ix_opportunities_source_created",
        "ix_opportunities_opportunity_type",
        "ix_opportunities_city",
        "ix_opportunities_is_duplicate",
    ]:
        try:
            op.drop_index(idx, "opportunities")
        except Exception:
            pass

    # Note: We don't drop columns in downgrade to avoid data loss
