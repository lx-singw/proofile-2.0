"""
Social interaction schemas for API requests/responses.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ============ Follow Schemas ============
class FollowCreate(BaseModel):
    following_id: int = Field(..., description="User ID to follow")


class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FollowStats(BaseModel):
    followers_count: int
    following_count: int


# ============ Connection Schemas ============
class ConnectionCreate(BaseModel):
    addressee_id: int = Field(..., description="User ID to connect with")
    message: Optional[str] = Field(None, max_length=500, description="Optional connection message")


class ConnectionUpdate(BaseModel):
    status: str = Field(..., description="New status: accepted or rejected")


class ConnectionResponse(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: str
    message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectionWithUser(ConnectionResponse):
    """Connection with user details for display."""
    user_name: str
    user_username: Optional[str]
    user_headline: Optional[str]
    user_avatar: Optional[str]


# ============ ProfileStar Schemas ============
class ProfileStarCreate(BaseModel):
    starred_user_id: int = Field(..., description="User ID to star")


class ProfileStarResponse(BaseModel):
    id: int
    user_id: int
    starred_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ ProfileWatch Schemas ============
class ProfileWatchCreate(BaseModel):
    watched_user_id: int = Field(..., description="User ID to watch")


class ProfileWatchResponse(BaseModel):
    id: int
    user_id: int
    watched_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Endorsement Schemas ============
class EndorsementCreate(BaseModel):
    endorsed_user_id: int = Field(..., description="User ID to endorse")
    skill: str = Field(..., max_length=100, description="Skill to endorse")
    comment: Optional[str] = Field(None, max_length=500, description="Optional comment")


class EndorsementResponse(BaseModel):
    id: int
    endorser_id: int
    endorsed_user_id: int
    skill: str
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SkillEndorsementSummary(BaseModel):
    """Summary of endorsements for a specific skill."""
    skill: str
    endorsement_count: int
    endorsers: List[str]  # List of endorser names


# ============ Rating Schemas ============
class RatingCreate(BaseModel):
    rated_user_id: int = Field(..., description="User ID to rate")
    score: int = Field(..., ge=1, le=5, description="Rating score 1-5")
    category: str = Field(..., description="Rating category")
    review: Optional[str] = Field(None, max_length=1000, description="Optional review text")
    is_anonymous: bool = Field(False, description="Whether rating is anonymous")


class RatingResponse(BaseModel):
    id: int
    rater_id: Optional[int]  # None if anonymous
    rated_user_id: int
    score: int
    category: str
    review: Optional[str]
    is_anonymous: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RatingSummary(BaseModel):
    """Summary of ratings for a user."""
    average_score: float
    total_ratings: int
    category_scores: dict  # {category: average_score}


# ============ Social Stats Schemas ============
class ProfileSocialStats(BaseModel):
    """Complete social stats for a profile."""
    followers_count: int
    following_count: int
    connections_count: int
    stars_count: int
    endorsements_count: int
    ratings_count: int
    average_rating: Optional[float]
    
    # Current user's relationship with this profile
    is_following: bool = False
    is_connected: bool = False
    is_starred: bool = False
    is_watching: bool = False
    connection_status: Optional[str] = None  # pending, accepted, etc.
