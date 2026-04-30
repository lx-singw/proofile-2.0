"""add opportunity_activity table

Revision ID: sprint4_004
Revises: sprint4_003_add_opportunity_category
Create Date: 2026-04-29
"""
from alembic import op
import sqlalchemy as sa

revision = "sprint4_004"
down_revision = "sprint4_003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "opportunity_activity",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "opportunity_id",
            sa.Integer(),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
            index=True,
        ),
        sa.Column("activity_type", sa.String(30), nullable=False, index=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "user_id",
            "opportunity_id",
            "activity_type",
            name="uq_opp_activity_user_opp_type",
        ),
    )


def downgrade() -> None:
    op.drop_table("opportunity_activity")
