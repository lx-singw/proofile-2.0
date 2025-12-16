"""create saved jobs table

Revision ID: sprint2_003
Revises: sprint2_002
Create Date: 2025-12-05 19:47:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'sprint2_003'
down_revision = 'sprint2_002'
branch_labels = None
depends_on = None


def upgrade():
    # Create saved_jobs table
    op.create_table(
        'saved_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('jobs.id'), nullable=False, index=True),
        sa.Column('saved_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.UniqueConstraint('user_id', 'job_id', name='unique_user_job')
    )


def downgrade():
    # Drop saved_jobs table
    op.drop_table('saved_jobs')
