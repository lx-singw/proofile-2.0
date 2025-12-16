"""add personalization dimension columns to users

Revision ID: e1a2b3c4d5e6
Revises: sprint3_001_social_models
Create Date: 2025-12-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1a2b3c4d5e6'
down_revision = 'd7e8f9a2b3c4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Dimension 4: Experience Level (extended)
    op.add_column('users', sa.Column('years_experience', sa.Integer(), nullable=True))
    
    # Dimension 5: Location/Province (SA-Specific)
    op.add_column('users', sa.Column('province', sa.String(), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(), nullable=True))
    op.add_column('users', sa.Column('willing_to_relocate', sa.Boolean(), server_default='false', nullable=True))
    
    # Dimension 6: Career Intent
    op.add_column('users', sa.Column('career_intent', sa.String(), nullable=True))
    op.add_column('users', sa.Column('available_from', sa.String(), nullable=True))
    op.add_column('users', sa.Column('notice_period_weeks', sa.Integer(), nullable=True))
    
    # Dimension 9: Salary Expectations
    op.add_column('users', sa.Column('salary_expectation_min', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('salary_expectation_max', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('salary_negotiable', sa.Boolean(), server_default='true', nullable=True))
    
    # Dimension 10: Work Mode Preference
    op.add_column('users', sa.Column('work_mode_preference', sa.String(), nullable=True))
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
