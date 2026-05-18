"""create verified_reviews table

Revision ID: mvp_001
Revises: sprint5_001
Create Date: 2026-05-14

The core table for the Proofile trust graph. Each row represents a review
request and (once completed) a verified review tied to a work experience entry.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision = "mvp_001"
down_revision = "sprint5_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "verified_reviews",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("token", sa.String(64), unique=True, nullable=False, index=True),

        # Who is being reviewed, and for which work entry
        sa.Column("reviewee_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("work_experience_id", UUID(as_uuid=True), sa.ForeignKey("work_experiences.id", ondelete="CASCADE"), nullable=False, index=True),

        # Reviewer identity — always public
        sa.Column("reviewer_email", sa.String(255), nullable=False),
        sa.Column("reviewer_name", sa.String(255), nullable=True),
        sa.Column("reviewer_title", sa.String(255), nullable=True),
        sa.Column("reviewer_company", sa.String(255), nullable=True),
        sa.Column("reviewer_proofile_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),

        # Relationship context
        sa.Column("relationship_type", sa.String(50), nullable=False),

        # Review content — filled on submission
        sa.Column("star_rating", sa.Integer(), nullable=True),
        sa.Column("written_review", sa.Text(), nullable=True),
        sa.Column("endorsed_skills", JSON, nullable=True, server_default="[]"),

        # Computed on submission
        sa.Column("reviewer_seniority_score", sa.Float(), nullable=True, server_default="4.0"),

        # Status tracking
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("reminder_sent_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("viewed_at", sa.DateTime(), nullable=True),

        # Integrity
        sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("flag_reason", sa.Text(), nullable=True),
        sa.Column("is_disputed", sa.Boolean(), nullable=False, server_default="false"),

        # Timestamps
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),

        # Constraints
        sa.CheckConstraint(
            "star_rating IS NULL OR (star_rating >= 1 AND star_rating <= 5)",
            name="valid_review_star_range",
        ),
    )


def downgrade() -> None:
    op.drop_table("verified_reviews")
