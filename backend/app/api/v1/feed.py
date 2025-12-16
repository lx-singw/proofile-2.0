"""
Feed API Endpoints

Routes for feed posts, reactions, and comments.
All endpoints require authentication.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.feed_service import FeedService
from app.schemas.feed import (
    PostCreate, PostUpdate, PostResponse, PostList,
    CommentCreate, CommentResponse,
    ReactionCreate, ReactionSummary,
    FeedFilters, FeedResponse
)
from app.models.post import PostType
from app.models.reaction import ReactionType

router = APIRouter(prefix="/feed", tags=["feed"])


# ==================== Feed Endpoints ====================

@router.get("", response_model=FeedResponse)
async def get_feed(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    following_only: bool = Query(False),
    types: Optional[str] = Query(None, description="Comma-separated post types"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized feed for authenticated user.
    
    - **page**: Page number (default: 1)
    - **size**: Items per page (default: 20, max: 50)
    - **following_only**: Only show posts from followed users
    - **types**: Filter by post types (comma-separated)
    """
    service = FeedService(db)
    
    # Parse filters
    filters = FeedFilters(following_only=following_only)
    if types:
        try:
            filters.types = [PostType(t.strip()) for t in types.split(",")]
        except ValueError:
            pass
    
    posts, has_more = service.get_feed(
        user_id=current_user.id,
        filters=filters,
        page=page,
        size=size
    )
    
    enriched_posts = [service.enrich_post(post, current_user.id) for post in posts]
    
    return FeedResponse(
        posts=enriched_posts,
        has_more=has_more,
        next_cursor=str(page + 1) if has_more else None
    )


# ==================== Post Endpoints ====================

@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new post"""
    service = FeedService(db)
    post = service.create_post(current_user.id, data)
    return service.enrich_post(post, current_user.id)


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single post by ID"""
    service = FeedService(db)
    post = service.get_post(post_id, current_user.id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    return service.enrich_post(post, current_user.id)


@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a post (only by author)"""
    service = FeedService(db)
    post = service.update_post(post_id, current_user.id, data)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission"
        )
    
    return service.enrich_post(post, current_user.id)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a post (soft delete, only by author)"""
    service = FeedService(db)
    success = service.delete_post(post_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission"
        )


# ==================== Reaction Endpoints ====================

@router.post("/posts/{post_id}/react")
async def toggle_reaction(
    post_id: int,
    data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle reaction on a post.
    - If no reaction exists, adds the reaction.
    - If same reaction exists, removes it.
    - If different reaction exists, changes it.
    """
    service = FeedService(db)
    result = service.toggle_reaction(post_id, current_user.id, data.type)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    return {"action": result, "type": data.type.value}


@router.get("/posts/{post_id}/reactions", response_model=ReactionSummary)
async def get_reactions(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get reaction summary for a post"""
    service = FeedService(db)
    return service._get_reaction_summary(post_id)


# ==================== Comment Endpoints ====================

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a post"""
    service = FeedService(db)
    
    # Verify post exists
    post = service.get_post(post_id, current_user.id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comment = service.add_comment(post_id, current_user.id, data)
    return service._enrich_comment(comment, current_user.id)


@router.get("/posts/{post_id}/comments")
async def get_comments(
    post_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated comments for a post"""
    service = FeedService(db)
    comments, has_more = service.get_comments(post_id, page, size, current_user.id)
    
    return {
        "comments": comments,
        "page": page,
        "size": size,
        "has_more": has_more
    }


# ==================== User Posts Endpoints ====================

@router.get("/users/{user_id}/posts", response_model=PostList)
async def get_user_posts(
    user_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get posts from a specific user"""
    service = FeedService(db)
    
    filters = FeedFilters(user_ids=[user_id])
    posts, has_more = service.get_feed(
        user_id=current_user.id,
        filters=filters,
        page=page,
        size=size
    )
    
    enriched = [service.enrich_post(post, current_user.id) for post in posts]
    
    return PostList(
        items=enriched,
        total=len(enriched),
        page=page,
        size=size,
        has_more=has_more
    )
