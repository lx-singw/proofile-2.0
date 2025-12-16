"""
Feed Schemas

Pydantic schemas for feed posts, reactions, and comments.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

from app.models.post import PostType, PostVisibility
from app.models.reaction import ReactionType


# ==================== User Schemas (for embedding) ====================

class UserBrief(BaseModel):
    """Brief user info for embedding in responses"""
    id: int
    full_name: Optional[str] = None
    username: Optional[str] = None
    profile_photo_url: Optional[str] = None
    headline: Optional[str] = None
    trust_score: Optional[int] = 0
    
    class Config:
        from_attributes = True


# ==================== Reaction Schemas ====================

class ReactionCreate(BaseModel):
    """Schema for creating a reaction"""
    type: ReactionType = ReactionType.LIKE


class ReactionResponse(BaseModel):
    """Schema for reaction response"""
    id: int
    type: ReactionType
    user: UserBrief
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReactionSummary(BaseModel):
    """Aggregated reaction counts"""
    like: int = 0
    celebrate: int = 0
    support: int = 0
    insightful: int = 0
    curious: int = 0
    total: int = 0


# ==================== Comment Schemas ====================

class CommentCreate(BaseModel):
    """Schema for creating a comment"""
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    """Schema for updating a comment"""
    content: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    """Schema for comment response"""
    id: int
    post_id: int
    user: UserBrief
    content: str
    parent_id: Optional[int] = None
    likes_count: int = 0
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = []
    is_liked: bool = False  # Whether current user liked this comment
    
    class Config:
        from_attributes = True


# ==================== Post Schemas ====================

class PostCreate(BaseModel):
    """Schema for creating a post"""
    type: PostType = PostType.TEXT
    content: str = Field(..., min_length=1, max_length=5000)
    visibility: PostVisibility = PostVisibility.PUBLIC
    metadata: Optional[dict] = None  # For polls, job shares, etc.
    media_urls: Optional[List[str]] = None


class PostUpdate(BaseModel):
    """Schema for updating a post"""
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    visibility: Optional[PostVisibility] = None
    metadata: Optional[dict] = None


class PostResponse(BaseModel):
    """Schema for post response"""
    id: int
    user: UserBrief
    type: PostType
    content: str
    visibility: PostVisibility
    metadata: Optional[dict] = None
    media_urls: Optional[List[str]] = None
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    is_pinned: bool = False
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime
    
    # Engagement details
    reaction_summary: Optional[ReactionSummary] = None
    user_reaction: Optional[ReactionType] = None  # Current user's reaction
    top_comments: List[CommentResponse] = []  # Preview of comments
    
    class Config:
        from_attributes = True


class PostList(BaseModel):
    """Paginated list of posts"""
    items: List[PostResponse]
    total: int
    page: int
    size: int
    has_more: bool


# ==================== Feed Schemas ====================

class FeedFilters(BaseModel):
    """Filters for feed"""
    types: Optional[List[PostType]] = None
    user_ids: Optional[List[int]] = None
    following_only: bool = False


class FeedResponse(BaseModel):
    """Feed response with posts and metadata"""
    posts: List[PostResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False


# Update forward references
CommentResponse.model_rebuild()
PostResponse.model_rebuild()
