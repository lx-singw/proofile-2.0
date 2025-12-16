"""Add username and public profile fields to User

Revision ID: add_username_profile
Revises: d045b3384f88
Create Date: 2025-12-04 20:12:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abc123def456'
down_revision = 'd045b3384f88'
branch_labels = None
depends_on = None


def upgrade():
    # Add username column (nullable, unique)
    op.add_column('users', sa.Column('username', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Add bio column
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    
    # Add profile_photo_url column
    op.add_column('users', sa.Column('profile_photo_url', sa.String(), nullable=True))
    
    # Add profile_visibility column with default 'public'
    op.add_column('users', sa.Column('profile_visibility', sa.String(), nullable=False, server_default='public'))


def downgrade():
    # Remove profile_visibility column
    op.drop_column('users', 'profile_visibility')
    
    # Remove profile_photo_url column
    op.drop_column('users', 'profile_photo_url')
    
    # Remove bio column
    op.drop_column('users', 'bio')
    
    # Remove username index and column
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')
