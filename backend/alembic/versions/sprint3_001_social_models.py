"""add social verification and ai chat tables

Revision ID: sprint3_001
Revises: sprint2_003
Create Date: 2025-12-07

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'sprint3_001'
down_revision = 'sprint2_003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create follows table
    op.create_table(
        'follows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('follower_id', sa.Integer(), nullable=False),
        sa.Column('following_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
        sa.CheckConstraint('follower_id != following_id', name='no_self_follow')
    )
    op.create_index('ix_follows_follower_id', 'follows', ['follower_id'])
    op.create_index('ix_follows_following_id', 'follows', ['following_id'])

    # Create connections table
    op.create_table(
        'connections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requester_id', sa.Integer(), nullable=False),
        sa.Column('addressee_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, default='pending'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['addressee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requester_id', 'addressee_id', name='unique_connection_request'),
        sa.CheckConstraint('requester_id != addressee_id', name='no_self_connection')
    )
    op.create_index('ix_connections_requester_id', 'connections', ['requester_id'])
    op.create_index('ix_connections_addressee_id', 'connections', ['addressee_id'])

    # Create profile_stars table
    op.create_table(
        'profile_stars',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('starred_user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['starred_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'starred_user_id', name='unique_profile_star'),
        sa.CheckConstraint('user_id != starred_user_id', name='no_self_star')
    )
    op.create_index('ix_profile_stars_user_id', 'profile_stars', ['user_id'])
    op.create_index('ix_profile_stars_starred_user_id', 'profile_stars', ['starred_user_id'])

    # Create profile_watches table
    op.create_table(
        'profile_watches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('watched_user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['watched_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'watched_user_id', name='unique_profile_watch'),
        sa.CheckConstraint('user_id != watched_user_id', name='no_self_watch')
    )
    op.create_index('ix_profile_watches_user_id', 'profile_watches', ['user_id'])
    op.create_index('ix_profile_watches_watched_user_id', 'profile_watches', ['watched_user_id'])

    # Create endorsements table
    op.create_table(
        'endorsements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('endorser_id', sa.Integer(), nullable=False),
        sa.Column('endorsed_user_id', sa.Integer(), nullable=False),
        sa.Column('skill', sa.String(100), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['endorser_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['endorsed_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endorser_id', 'endorsed_user_id', 'skill', name='unique_skill_endorsement'),
        sa.CheckConstraint('endorser_id != endorsed_user_id', name='no_self_endorsement')
    )
    op.create_index('ix_endorsements_endorser_id', 'endorsements', ['endorser_id'])
    op.create_index('ix_endorsements_endorsed_user_id', 'endorsements', ['endorsed_user_id'])

    # Create ratings table
    op.create_table(
        'ratings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rater_id', sa.Integer(), nullable=False),
        sa.Column('rated_user_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('review', sa.Text(), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['rater_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rated_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rater_id', 'rated_user_id', 'category', name='unique_category_rating'),
        sa.CheckConstraint('rater_id != rated_user_id', name='no_self_rating'),
        sa.CheckConstraint('score >= 1 AND score <= 5', name='valid_score_range')
    )
    op.create_index('ix_ratings_rater_id', 'ratings', ['rater_id'])
    op.create_index('ix_ratings_rated_user_id', 'ratings', ['rated_user_id'])

    # Create chat_sessions table
    op.create_table(
        'chat_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('session_type', sa.String(50), nullable=False, default='career_coach'),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_sessions_user_id', 'chat_sessions', ['user_id'])

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_messages_session_id', 'chat_messages', ['session_id'])

    # Create verifications table
    op.create_table(
        'verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('verification_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, default='not_started'),
        sa.Column('verification_data', sa.Text(), nullable=True),
        sa.Column('document_url', sa.String(500), nullable=True),
        sa.Column('verified_value', sa.String(255), nullable=True),
        sa.Column('verification_provider', sa.String(100), nullable=True),
        sa.Column('verification_reference', sa.String(255), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_verifications_user_id', 'verifications', ['user_id'])


def downgrade() -> None:
    op.drop_table('verifications')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
    op.drop_table('ratings')
    op.drop_table('endorsements')
    op.drop_table('profile_watches')
    op.drop_table('profile_stars')
    op.drop_table('connections')
    op.drop_table('follows')
