"""
Feed Service

Business logic for feed posts, reactions, and comments.
"""
import math
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models.post import Post, PostType, PostVisibility
from app.models.reaction import Reaction, ReactionType
from app.models.comment import Comment
from app.models.user import User
from app.models.social import Follow, Connection
from app.schemas.feed import (
    PostCreate, PostUpdate, PostResponse,
    CommentCreate, CommentUpdate, CommentResponse,
    ReactionCreate, ReactionSummary, UserBrief,
    FeedFilters, FeedResponse
)


from app.core import broadcaster

class FeedService:
    """Service for feed operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ==================== Post Operations ====================
    
    async def create_post(self, user_id: int, data: PostCreate) -> Post:
        """Create a new post"""
        post = Post(
            user_id=user_id,
            type=data.type.value,
            content=data.content,
            visibility=data.visibility.value,
            post_metadata=str(data.metadata) if data.metadata else None,
            media_urls=data.media_urls,
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)

        # Broadcast the new post
        # We enrichment is needed for the frontend to render it properly
        enriched = await self.enrich_post(post)
        await broadcaster.publish("global_feed", {
            "event": "FEED_UPDATE",
            "type": "new_post",
            "data": enriched.model_dump(mode='json')
        })

        return post
    
    async def get_post(self, post_id: int, current_user_id: Optional[int] = None) -> Optional[Post]:
        """Get a post by ID with visibility check"""
        result = await self.db.execute(
            select(Post).where(Post.id == post_id, Post.is_deleted == False)
        )
        post = result.scalar_one_or_none()

        if not post:
            return None

        # Check visibility
        if post.visibility == PostVisibility.PUBLIC.value:
            return post
        elif post.visibility == PostVisibility.CONNECTIONS.value:
            if current_user_id == post.user_id:
                return post
            # Check if connected
            if await self._are_connected(current_user_id, post.user_id):
                return post
            return None
        elif post.visibility == PostVisibility.PRIVATE.value:
            return post if current_user_id == post.user_id else None

        return post
    
    async def update_post(self, post_id: int, user_id: int, data: PostUpdate) -> Optional[Post]:
        """Update a post"""
        result = await self.db.execute(
            select(Post).where(Post.id == post_id, Post.user_id == user_id, Post.is_deleted == False)
        )
        post = result.scalar_one_or_none()

        if not post:
            return None

        if data.content:
            post.content = data.content
        if data.visibility:
            post.visibility = data.visibility.value
        if data.metadata is not None:
            post.post_metadata = str(data.metadata)

        post.is_edited = True
        post.edited_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(post)
        return post
    
    async def delete_post(self, post_id: int, user_id: int) -> bool:
        """Soft delete a post"""
        result = await self.db.execute(
            select(Post).where(Post.id == post_id, Post.user_id == user_id, Post.is_deleted == False)
        )
        post = result.scalar_one_or_none()

        if not post:
            return False

        post.is_deleted = True
        post.deleted_at = datetime.utcnow()
        await self.db.commit()
        return True
    
    # ==================== Feed Operations ====================
    
    async def get_feed(
        self,
        user_id: int,
        filters: Optional[FeedFilters] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Post], bool]:
        """
        Get paginated feed for user with smart ranking algorithm.

        Ranking factors:
        1. Engagement Score: likes, comments, shares
        2. Recency Decay: newer posts score higher
        3. Author Trust: verified/high-trust authors boosted
        4. Personalization: posts from connections/followed users
        5. Diversity: avoid showing too many posts from same author
        """
        stmt = select(Post).where(Post.is_deleted == False)

        # Filter by visibility
        visibility_filter = or_(
            Post.visibility == PostVisibility.PUBLIC.value,
            Post.user_id == user_id,
        )

        # Get following and connection IDs for personalization
        following_ids = await self._get_following_ids(user_id)
        connection_ids = await self._get_connection_ids(user_id)
        all_network_ids = set(following_ids + connection_ids)

        if filters and filters.following_only:
            stmt = stmt.where(
                and_(
                    Post.user_id.in_(list(all_network_ids) + [user_id]),
                    visibility_filter
                )
            )
        else:
            stmt = stmt.where(visibility_filter)

        # Apply type filters
        if filters and filters.types:
            stmt = stmt.where(Post.type.in_([t.value for t in filters.types]))

        # Apply user filters
        if filters and filters.user_ids:
            stmt = stmt.where(Post.user_id.in_(filters.user_ids))

        # Fetch more posts than needed for re-ranking
        fetch_limit = min(page * size * 3, 200)  # Fetch 3x for ranking, max 200
        raw_result = await self.db.execute(stmt.order_by(desc(Post.created_at)).limit(fetch_limit))
        raw_posts = list(raw_result.scalars().all())

        # Get user preference for boost
        user_result = await self.db.execute(select(User).where(User.id == user_id))
        current_user = user_result.scalar_one_or_none()
        user_pref = current_user.opportunity_preference if current_user else None

        # Pre-fetch all author users to avoid N+1 queries in _rank_posts
        author_ids = list({p.user_id for p in raw_posts})
        users_result = await self.db.execute(select(User).where(User.id.in_(author_ids)))
        users_by_id = {u.id: u for u in users_result.scalars().all()}

        # Apply smart ranking
        ranked_posts = self._rank_posts(raw_posts, user_id, all_network_ids, user_pref, users_by_id)

        # Paginate
        offset = (page - 1) * size
        paginated = ranked_posts[offset:offset + size + 1]

        has_more = len(paginated) > size
        return paginated[:size], has_more
    
    def _rank_posts(
        self,
        posts: List[Post],
        user_id: int,
        network_ids: set,
        user_pref: Optional[str] = None,
        users_by_id: Optional[dict] = None,
    ) -> List[Post]:
        """
        Rank posts using engagement and personalization signals.
        
        Score = (engagement_score * recency_decay * trust_boost * network_boost) - diversity_penalty
        """
        import math
        from datetime import datetime, timedelta
        
        if users_by_id is None:
            users_by_id = {}
        now = datetime.utcnow()
        scored_posts = []
        author_counts = {}  # Track posts per author for diversity
        
        for post in posts:
            # 1. Engagement Score (logarithmic to prevent gaming)
            engagement = (
                post.likes_count * 1.0 +
                post.comments_count * 2.0 +  # Comments worth more
                post.shares_count * 3.0      # Shares worth most
            )
            engagement_score = math.log1p(engagement)  # log(1 + x)
            
            # 2. Recency Decay (half-life of 24 hours)
            age_hours = (now - post.created_at).total_seconds() / 3600
            half_life = 24  # Posts lose half their freshness every 24 hours
            recency_decay = math.pow(0.5, age_hours / half_life)
            recency_decay = max(recency_decay, 0.1)  # Minimum 10% freshness
            
            # 3. Trust Boost
            trust_boost = 1.0
            user = users_by_id.get(post.user_id)
            if user:
                # Trust score 0-100, map to 0.8-1.2x boost
                trust_boost = 0.8 + ((user.trust_score or 0) / 100) * 0.4
            
            # 4. Network Boost (higher for connections/followed)
            network_boost = 1.0
            if post.user_id in network_ids:
                network_boost = 1.5  # 50% boost for network posts
            if post.user_id == user_id:
                network_boost = 0.8  # Slight penalty for own posts (user already saw them)
            
            # 5. Content Type Boost
            type_boost = 1.0
            if post.type == PostType.MILESTONE.value:
                type_boost = 1.3  # Milestones are interesting
            elif post.type == PostType.JOB_SHARE.value:
                type_boost = 1.2  # Jobs are useful
            elif post.type == PostType.SKILL_VERIFIED.value:
                type_boost = 1.2  # Verified skills are notable
            
            # 6. Diversity Penalty (reduce score if same author appears too often)
            author_count = author_counts.get(post.user_id, 0)
            diversity_penalty = math.pow(0.7, author_count)  # 30% penalty per duplicate
            author_counts[post.user_id] = author_count + 1
            
            # 7. Preference Boost (Matching user's career path)
            pref_boost = 1.0
            if user_pref and post.type == PostType.JOB_SHARE.value:
                try:
                    # Use eval to match current format (str representation of dict)
                    meta = eval(post.post_metadata) if post.post_metadata else {}
                    if meta.get("opportunity_category") == user_pref:
                        pref_boost = 1.6  # 60% boost for matching preference
                except:
                    pass
            
            # Calculate final score
            score = (
                engagement_score *
                recency_decay *
                trust_boost *
                network_boost *
                type_boost *
                diversity_penalty *
                pref_boost
            )
            
            scored_posts.append((score, post))
        
        # Sort by score descending
        scored_posts.sort(key=lambda x: x[0], reverse=True)
        
        return [post for _, post in scored_posts]
    
    async def _get_connection_ids(self, user_id: int) -> List[int]:
        """Get IDs of users that user_id is connected with"""
        result = await self.db.execute(
            select(Connection).where(
                or_(
                    and_(Connection.requester_id == user_id, Connection.status == "accepted"),
                    and_(Connection.addressee_id == user_id, Connection.status == "accepted")
                )
            )
        )
        connections = result.scalars().all()
        return [
            c.addressee_id if c.requester_id == user_id else c.requester_id
            for c in connections
        ]
    
    async def enrich_post(self, post: Post, current_user_id: Optional[int] = None) -> PostResponse:
        """Enrich a post with user info, reactions, and comments"""
        user_result = await self.db.execute(select(User).where(User.id == post.user_id))
        user = user_result.scalar_one_or_none()

        user_brief = UserBrief(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            profile_photo_url=user.profile_photo_url,
            headline=user.profile.headline if user.profile else None,
            trust_score=user.trust_score
        ) if user else None

        # Get reaction summary
        reaction_summary = await self._get_reaction_summary(post.id)

        # Get user's reaction if logged in
        user_reaction = None
        if current_user_id:
            r_result = await self.db.execute(
                select(Reaction).where(Reaction.post_id == post.id, Reaction.user_id == current_user_id)
            )
            reaction = r_result.scalar_one_or_none()
            if reaction:
                user_reaction = ReactionType(reaction.type)

        # Get top 3 comments
        c_result = await self.db.execute(
            select(Comment).where(
                Comment.post_id == post.id,
                Comment.is_deleted == False,
                Comment.parent_id == None
            ).order_by(desc(Comment.likes_count)).limit(3)
        )
        top_comments = list(c_result.scalars().all())

        return PostResponse(
            id=post.id,
            user=user_brief,
            type=PostType(post.type),
            content=post.content,
            visibility=PostVisibility(post.visibility),
            metadata=eval(post.post_metadata) if post.post_metadata else None,  # nosec
            media_urls=post.media_urls,
            likes_count=post.likes_count,
            comments_count=post.comments_count,
            shares_count=post.shares_count,
            is_pinned=post.is_pinned,
            is_edited=post.is_edited,
            created_at=post.created_at,
            updated_at=post.updated_at,
            reaction_summary=reaction_summary,
            user_reaction=user_reaction,
            top_comments=[await self._enrich_comment(c, current_user_id) for c in top_comments]
        )
    
    # ==================== Reaction Operations ====================
    
    async def toggle_reaction(self, post_id: int, user_id: int, reaction_type: ReactionType) -> Optional[str]:
        """Toggle or change reaction on a post. Returns 'added', 'changed', 'removed', or None on error."""
        r_result = await self.db.execute(
            select(Reaction).where(Reaction.post_id == post_id, Reaction.user_id == user_id)
        )
        existing = r_result.scalar_one_or_none()

        p_result = await self.db.execute(select(Post).where(Post.id == post_id))
        post = p_result.scalar_one_or_none()
        if not post:
            return None

        action = None
        if existing:
            if existing.type == reaction_type.value:
                # Remove reaction
                await self.db.delete(existing)
                post.likes_count = max(0, post.likes_count - 1)
                await self.db.commit()
                action = "removed"
            else:
                # Change reaction type
                existing.type = reaction_type.value
                await self.db.commit()
                action = "changed"
        else:
            # Add new reaction
            reaction = Reaction(
                post_id=post_id,
                user_id=user_id,
                type=reaction_type.value
            )
            self.db.add(reaction)
            post.likes_count += 1
            await self.db.commit()
            action = "added"

        if action:
            # Broadcast reaction update
            await broadcaster.publish("global_feed", {
                "event": "REACTION_UPDATE",
                "post_id": post_id,
                "action": action,
                "type": reaction_type.value,
                "likes_count": post.likes_count,
                "user_id": user_id
            })

        return action
    
    async def _get_reaction_summary(self, post_id: int) -> ReactionSummary:
        """Get aggregated reaction counts for a post"""
        result = await self.db.execute(
            select(Reaction.type, func.count(Reaction.id))
            .where(Reaction.post_id == post_id)
            .group_by(Reaction.type)
        )
        rows = result.all()

        summary = ReactionSummary()
        total = 0
        for reaction_type, count in rows:
            setattr(summary, reaction_type, count)
            total += count
        summary.total = total

        return summary
    
    # ==================== Comment Operations ====================
    
    async def add_comment(self, post_id: int, user_id: int, data: CommentCreate) -> Comment:
        """Add a comment to a post"""
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=data.content,
            parent_id=data.parent_id
        )
        self.db.add(comment)

        # Update comment count
        p_result = await self.db.execute(select(Post).where(Post.id == post_id))
        post = p_result.scalar_one_or_none()
        if post:
            post.comments_count += 1

        await self.db.commit()
        await self.db.refresh(comment)

        # Broadcast comment update
        enriched = await self._enrich_comment(comment, user_id)
        await broadcaster.publish("global_feed", {
            "event": "COMMENT_UPDATE",
            "post_id": post_id,
            "comment": enriched.model_dump(mode='json'),
            "comments_count": post.comments_count if post else 0
        })

        return comment
    
    async def get_comments(
        self,
        post_id: int,
        page: int = 1,
        size: int = 20,
        current_user_id: Optional[int] = None
    ) -> Tuple[List[CommentResponse], bool]:
        """Get paginated comments for a post"""
        offset = (page - 1) * size
        result = await self.db.execute(
            select(Comment).where(
                Comment.post_id == post_id,
                Comment.is_deleted == False,
                Comment.parent_id == None  # Top-level comments only
            ).order_by(desc(Comment.created_at)).offset(offset).limit(size + 1)
        )
        comments = list(result.scalars().all())

        has_more = len(comments) > size
        enriched = [await self._enrich_comment(c, current_user_id) for c in comments[:size]]

        return enriched, has_more
    
    async def _enrich_comment(self, comment: Comment, current_user_id: Optional[int] = None) -> CommentResponse:
        """Enrich a comment with user info and replies"""
        u_result = await self.db.execute(select(User).where(User.id == comment.user_id))
        user = u_result.scalar_one_or_none()

        user_brief = UserBrief(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            profile_photo_url=user.profile_photo_url,
            headline=user.profile.headline if user.profile else None,
            trust_score=user.trust_score
        ) if user else None

        # Get replies
        r_result = await self.db.execute(
            select(Comment).where(
                Comment.parent_id == comment.id,
                Comment.is_deleted == False
            ).order_by(Comment.created_at).limit(5)
        )
        replies = list(r_result.scalars().all())

        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user=user_brief,
            content=comment.content,
            parent_id=comment.parent_id,
            likes_count=comment.likes_count,
            is_edited=comment.is_edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            replies=[await self._enrich_comment(r, current_user_id) for r in replies],
            is_liked=False  # TODO: Check if current user liked
        )
    
    # ==================== Helper Methods ====================
    
    async def _get_following_ids(self, user_id: int) -> List[int]:
        """Get IDs of users that user_id follows"""
        result = await self.db.execute(
            select(Follow.following_id).where(Follow.follower_id == user_id)
        )
        return list(result.scalars().all())
    
    async def _are_connected(self, user_id_1: Optional[int], user_id_2: int) -> bool:
        """Check if two users are connected"""
        if not user_id_1:
            return False

        result = await self.db.execute(
            select(Connection).where(
                or_(
                    and_(Connection.requester_id == user_id_1, Connection.addressee_id == user_id_2),
                    and_(Connection.requester_id == user_id_2, Connection.addressee_id == user_id_1)
                ),
                Connection.status == "accepted"
            )
        )
        return result.scalar_one_or_none() is not None
