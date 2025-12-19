"""add user personalization dimensions

Revision ID: sprint3_002
Revises: sprint3_001
Create Date: 2025-12-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'sprint3_002'
down_revision = 'sprint3_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add personalization dimension columns to users table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [c['name'] for c in inspector.get_columns('users')]
    
    if 'opportunity_preference' not in existing_columns:
        op.add_column('users', sa.Column('opportunity_preference', sa.String(), nullable=True))
    if 'years_experience' not in existing_columns:
        op.add_column('users', sa.Column('years_experience', sa.Integer(), nullable=True))
    if 'province' not in existing_columns:
        op.add_column('users', sa.Column('province', sa.String(), nullable=True))
    if 'city' not in existing_columns:
        op.add_column('users', sa.Column('city', sa.String(), nullable=True))
    if 'willing_to_relocate' not in existing_columns:
        op.add_column('users', sa.Column('willing_to_relocate', sa.Boolean(), server_default='false', nullable=False))
    if 'career_intent' not in existing_columns:
        op.add_column('users', sa.Column('career_intent', sa.String(), nullable=True))
    if 'available_from' not in existing_columns:
        op.add_column('users', sa.Column('available_from', sa.String(), nullable=True))
    if 'notice_period_weeks' not in existing_columns:
        op.add_column('users', sa.Column('notice_period_weeks', sa.Integer(), nullable=True))
    if 'salary_expectation_min' not in existing_columns:
        op.add_column('users', sa.Column('salary_expectation_min', sa.Integer(), nullable=True))
    if 'salary_expectation_max' not in existing_columns:
        op.add_column('users', sa.Column('salary_expectation_max', sa.Integer(), nullable=True))
    if 'salary_negotiable' not in existing_columns:
        op.add_column('users', sa.Column('salary_negotiable', sa.Boolean(), server_default='true', nullable=False))
    if 'work_mode_preference' not in existing_columns:
        op.add_column('users', sa.Column('work_mode_preference', sa.String(), nullable=True))
    if 'max_commute_minutes' not in existing_columns:
        op.add_column('users', sa.Column('max_commute_minutes', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'max_commute_minutes')
    op.drop_column('users', 'work_mode_preference')
    op.drop_column('users', 'salary_negotiable')
    op.drop_column('users', 'salary_expectation_max')
    op.drop_column('users', 'salary_expectation_min')
    op.drop_column('users', 'notice_period_weeks')
    op.drop_column('users', 'available_from')
    op.drop_column('users', 'career_intent')
    op.drop_column('users', 'willing_to_relocate')
    op.drop_column('users', 'city')
    op.drop_column('users', 'province')
    op.drop_column('users', 'years_experience')
    op.drop_column('users', 'opportunity_preference')
