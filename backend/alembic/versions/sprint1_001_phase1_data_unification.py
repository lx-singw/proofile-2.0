"""Phase 1 Sprint 1 Data Unification

Revision ID: sprint1_001_p1
Revises: sprint3_001
Create Date: 2025-12-12

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'sprint1_001_p1'
down_revision = 'sprint3_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create profile_data_sources table
    op.create_table(
        'profile_data_sources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False, default={}),
        sa.Column('confidence', sa.Float(), nullable=True, default=1.0),
        sa.Column('is_verified', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_profile_data_sources_id'), 'profile_data_sources', ['id'], unique=False)
    op.create_index(op.f('ix_profile_data_sources_user_id'), 'profile_data_sources', ['user_id'], unique=False)

    # 2. Add columns to profiles table
    op.add_column('profiles', sa.Column('state', sa.String(), nullable=True, default='embryo'))
    op.add_column('profiles', sa.Column('completeness_score', sa.Float(), nullable=True, default=0.0))
    op.add_column('profiles', sa.Column('completeness_data', sa.JSON(), nullable=True, default={}))
    op.add_column('profiles', sa.Column('skills_data', sa.JSON(), nullable=True, default=[]))
    op.add_column('profiles', sa.Column('experience_data', sa.JSON(), nullable=True, default=[]))
    op.add_column('profiles', sa.Column('education_data', sa.JSON(), nullable=True, default=[]))


def downgrade() -> None:
    # 1. Remove columns from profiles table
    op.drop_column('profiles', 'education_data')
    op.drop_column('profiles', 'experience_data')
    op.drop_column('profiles', 'skills_data')
    op.drop_column('profiles', 'completeness_data')
    op.drop_column('profiles', 'completeness_score')
    op.drop_column('profiles', 'state')

    # 2. Drop profile_data_sources table
    op.drop_index(op.f('ix_profile_data_sources_user_id'), table_name='profile_data_sources')
    op.drop_index(op.f('ix_profile_data_sources_id'), table_name='profile_data_sources')
    op.drop_table('profile_data_sources')
