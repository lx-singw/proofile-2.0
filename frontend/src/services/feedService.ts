/**
 * Feed Service
 * 
 * Frontend service for feed API integration.
 * Handles posts, reactions, and comments.
 */
import { apiRequest } from '@/lib/api';

// Types
export interface UserBrief {
    id: number;
    full_name?: string;
    username?: string;
    profile_photo_url?: string;
    headline?: string;
    trust_score?: number;
}

export interface ReactionSummary {
    like: number;
    celebrate: number;
    support: number;
    insightful: number;
    curious: number;
    total: number;
}

export interface CommentResponse {
    id: number;
    post_id: number;
    user: UserBrief;
    content: string;
    parent_id?: number;
    likes_count: number;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    replies: CommentResponse[];
    is_liked: boolean;
}

export interface PostResponse {
    id: number;
    user: UserBrief;
    type: "text" | "milestone" | "job_share" | "poll" | "achievement" | "skill_verified" | "profile_update";
    content: string;
    visibility: "public" | "connections" | "private";
    metadata?: Record<string, unknown>;
    media_urls?: string[];
    likes_count: number;
    comments_count: number;
    shares_count: number;
    is_pinned: boolean;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    reaction_summary?: ReactionSummary;
    user_reaction?: string;
    top_comments: CommentResponse[];
}

export interface FeedResponse {
    posts: PostResponse[];
    next_cursor?: string;
    has_more: boolean;
}

export interface PostCreate {
    type?: "text" | "milestone" | "job_share" | "poll" | "achievement";
    content: string;
    visibility?: "public" | "connections" | "private";
    metadata?: Record<string, unknown>;
    media_urls?: string[];
}

export type ReactionType = "like" | "celebrate" | "support" | "insightful" | "curious";

// Feed API
export const feedService = {
    /**
     * Get personalized feed
     */
    async getFeed(params?: {
        page?: number;
        size?: number;
        following_only?: boolean;
        types?: string;
    }): Promise<FeedResponse> {
        return apiRequest<FeedResponse>({
            method: 'GET',
            url: '/api/v1/feed',
            params,
        });
    },

    /**
     * Create a new post
     */
    async createPost(data: PostCreate): Promise<PostResponse> {
        return apiRequest<PostResponse>({
            method: 'POST',
            url: '/api/v1/feed/posts',
            data,
        });
    },

    /**
     * Get a single post
     */
    async getPost(postId: number): Promise<PostResponse> {
        return apiRequest<PostResponse>({
            method: 'GET',
            url: `/api/v1/feed/posts/${postId}`,
        });
    },

    /**
     * Update a post
     */
    async updatePost(postId: number, data: Partial<PostCreate>): Promise<PostResponse> {
        return apiRequest<PostResponse>({
            method: 'PUT',
            url: `/api/v1/feed/posts/${postId}`,
            data,
        });
    },

    /**
     * Delete a post
     */
    async deletePost(postId: number): Promise<void> {
        await apiRequest({
            method: 'DELETE',
            url: `/api/v1/feed/posts/${postId}`,
        });
    },

    /**
     * Toggle reaction on a post
     */
    async toggleReaction(postId: number, type: ReactionType): Promise<{ action: string; type: string }> {
        return apiRequest({
            method: 'POST',
            url: `/api/v1/feed/posts/${postId}/react`,
            data: { type },
        });
    },

    /**
     * Get reactions for a post
     */
    async getReactions(postId: number): Promise<ReactionSummary> {
        return apiRequest({
            method: 'GET',
            url: `/api/v1/feed/posts/${postId}/reactions`,
        });
    },

    /**
     * Add a comment to a post
     */
    async addComment(postId: number, content: string, parentId?: number): Promise<CommentResponse> {
        return apiRequest({
            method: 'POST',
            url: `/api/v1/feed/posts/${postId}/comments`,
            data: {
                content,
                parent_id: parentId,
            },
        });
    },

    /**
     * Get comments for a post
     */
    async getComments(postId: number, page = 1, size = 20): Promise<{
        comments: CommentResponse[];
        page: number;
        size: number;
        has_more: boolean;
    }> {
        return apiRequest({
            method: 'GET',
            url: `/api/v1/feed/posts/${postId}/comments`,
            params: { page, size },
        });
    },

    /**
     * Get posts from a specific user
     */
    async getUserPosts(userId: number, page = 1, size = 20): Promise<{
        items: PostResponse[];
        total: number;
        page: number;
        size: number;
        has_more: boolean;
    }> {
        return apiRequest({
            method: 'GET',
            url: `/api/v1/feed/users/${userId}/posts`,
            params: { page, size },
        });
    },

    /**
     * Execute an agentic action (e.g. draft cover letter) on a post
     */
    async executeAgentAction(postId: number, actionType: string, metadata?: any): Promise<{ draft: string; type: string }> {
        return apiRequest({
            method: 'POST',
            url: `/api/v1/agent-actions/feed/${postId}`,
            data: { action_type: actionType, metadata },
        });
    },
};

export default feedService;
