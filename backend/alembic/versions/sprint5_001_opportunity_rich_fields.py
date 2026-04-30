"""add rich AI-extracted fields to opportunities table

Revision ID: sprint5_001
Revises: sprint4_004
Create Date: 2026-04-30

Adds 13 new columns to store AI-extracted data that was previously discarded
during ingestion: benefits, required_documents, duration, start_date, scam_score,
red_flags, tags, qualification_requirements, experience_requirements,
skills_structured, knowledge_requirements, conditions_of_employment, contact_website.
"""
from alembic import op
import sqlalchemy as sa

revision = "sprint5_001"
down_revision = "sprint4_004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # JSON-stored list/dict fields (TEXT columns, serialised with json.dumps)
    op.add_column("opportunities", sa.Column("benefits", sa.Text(), nullable=True, comment="JSON array of benefit strings"))
    op.add_column("opportunities", sa.Column("required_documents", sa.Text(), nullable=True, comment="JSON array of required document strings"))
    op.add_column("opportunities", sa.Column("tags", sa.Text(), nullable=True, comment="JSON array of tag strings"))
    op.add_column("opportunities", sa.Column("red_flags", sa.Text(), nullable=True, comment="JSON array of scam/fraud flag strings"))
    op.add_column("opportunities", sa.Column("qualification_requirements", sa.Text(), nullable=True, comment="JSON object {minimum: {...}, ideal: {...}}"))
    op.add_column("opportunities", sa.Column("experience_requirements", sa.Text(), nullable=True, comment="JSON object {minimum: {...}, ideal: {...}}"))
    op.add_column("opportunities", sa.Column("skills_structured", sa.Text(), nullable=True, comment="JSON array of {name, level} objects"))
    op.add_column("opportunities", sa.Column("knowledge_requirements", sa.Text(), nullable=True, comment="JSON object {minimum: [...], ideal: [...]}"))
    op.add_column("opportunities", sa.Column("conditions_of_employment", sa.Text(), nullable=True, comment="JSON array of condition strings"))

    # Scalar fields
    op.add_column("opportunities", sa.Column("duration", sa.String(100), nullable=True, comment="Contract/programme duration e.g. '12 months', 'Permanent'"))
    op.add_column("opportunities", sa.Column("start_date", sa.Date(), nullable=True, comment="Position/programme start date"))
    op.add_column("opportunities", sa.Column("scam_score", sa.Float(), nullable=True, server_default="0.0", comment="Fraud probability 0.0-1.0"))
    op.add_column("opportunities", sa.Column("contact_website", sa.String(500), nullable=True, comment="Company career page or main website URL"))


def downgrade() -> None:
    op.drop_column("opportunities", "contact_website")
    op.drop_column("opportunities", "scam_score")
    op.drop_column("opportunities", "start_date")
    op.drop_column("opportunities", "duration")
    op.drop_column("opportunities", "conditions_of_employment")
    op.drop_column("opportunities", "knowledge_requirements")
    op.drop_column("opportunities", "skills_structured")
    op.drop_column("opportunities", "experience_requirements")
    op.drop_column("opportunities", "qualification_requirements")
    op.drop_column("opportunities", "red_flags")
    op.drop_column("opportunities", "tags")
    op.drop_column("opportunities", "required_documents")
    op.drop_column("opportunities", "benefits")
