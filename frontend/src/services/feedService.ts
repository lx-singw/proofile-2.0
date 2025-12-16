/**
 * Feed Service
 * 
 * Frontend service for feed API integration.
 * Handles posts, reactions, and comments.
 */
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const api = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

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
    type?: "text" | "milestone" | "job_share" | "poll";
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
        const response = await api.get("/feed", { params });
        return response.data;
    },

    /**
     * Create a new post
     */
    async createPost(data: PostCreate): Promise<PostResponse> {
        const response = await api.post("/feed/posts", data);
        return response.data;
    },

    /**
     * Get a single post
     */
    async getPost(postId: number): Promise<PostResponse> {
        const response = await api.get(`/feed/posts/${postId}`);
        return response.data;
    },

    /**
     * Update a post
     */
    async updatePost(postId: number, data: Partial<PostCreate>): Promise<PostResponse> {
        const response = await api.put(`/feed/posts/${postId}`, data);
        return response.data;
    },

    /**
     * Delete a post
     */
    async deletePost(postId: number): Promise<void> {
        await api.delete(`/feed/posts/${postId}`);
    },

    /**
     * Toggle reaction on a post
     */
    async toggleReaction(postId: number, type: ReactionType): Promise<{ action: string; type: string }> {
        const response = await api.post(`/feed/posts/${postId}/react`, { type });
        return response.data;
    },

    /**
     * Get reactions for a post
     */
    async getReactions(postId: number): Promise<ReactionSummary> {
        const response = await api.get(`/feed/posts/${postId}/reactions`);
        return response.data;
    },

    /**
     * Add a comment to a post
     */
    async addComment(postId: number, content: string, parentId?: number): Promise<CommentResponse> {
        const response = await api.post(`/feed/posts/${postId}/comments`, {
            content,
            parent_id: parentId,
        });
        return response.data;
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
        const response = await api.get(`/feed/posts/${postId}/comments`, {
            params: { page, size },
        });
        return response.data;
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
        const response = await api.get(`/feed/users/${userId}/posts`, {
            params: { page, size },
        });
        return response.data;
    },
};

export default feedService;
