/**
 * Reputation Service - API client for reputation endpoints
 * 
 * Handles all reputation-related API calls:
 * - Rating requests
 * - Rating submissions
 * - Reputation summaries
 */

import { apiRequest } from '@/lib/api';

// Types
export interface RatingRequest {
    id: number;
    token: string;
    status: 'pending' | 'completed' | 'expired';
    invitee_name?: string;
    invitee_email: string;
    relationship_type: string;
    company: string;
    share_url: string;
    expires_at: string;
    created_at: string;
}

export interface ReputationSummary {
    user_id: number;
    global_score: number;
    percentile: number;
    total_reviews: number;
    manager_score?: number;
    peer_score?: number;
    dimension_scores: Record<string, { score: number; count: number }>;
    signals: string[];
    level: string;
    badge: {
        color: string;
        label: string;
        score: number;
    };
}

export interface Review {
    id: string;
    overall_score: number;
    dimensions: Record<string, number>;
    text_content?: string;
    relationship_type: string;
    context_company: string;
    is_anonymous: boolean;
    created_at: string;
    author?: {
        name: string;
        role: string;
        avatar_url?: string;
        is_verified: boolean;
    };
}

// API Functions

/**
 * Create a new rating request
 */
export async function createRatingRequest(data: {
    recipient_email: string;
    recipient_name?: string;
    relationship: string;
    company: string;
    role_at_company?: string;
    personal_message?: string;
}): Promise<RatingRequest> {
    return apiRequest<RatingRequest>({
        method: 'POST',
        url: '/api/v1/ratings/request',
        data,
    });
}

/**
 * Get rating request by token (for rating form)
 */
export async function getRatingRequest(token: string): Promise<{
    request_id: number;
    requester: { name: string; avatar_url?: string };
    relationship: string;
    company: string;
    role_at_company?: string;
    personal_message?: string;
    expires_at: string;
}> {
    return apiRequest<any>({
        method: 'GET',
        url: `/api/v1/ratings/request/${token}`,
    });
}

/**
 * Submit a rating via token
 */
export async function submitRating(data: {
    token: string;
    overall_score: number;
    dimensions?: Record<string, number>;
    text_content?: string;
    is_anonymous?: boolean;
    rater_email?: string;
    rater_name?: string;
}): Promise<{ success: boolean; rating_id: number; message: string }> {
    return apiRequest<any>({
        method: 'POST',
        url: '/api/v1/ratings/submit',
        data,
    });
}

/**
 * Get reputation summary for a user
 */
export async function getReputationSummary(userId: number): Promise<ReputationSummary> {
    return apiRequest<ReputationSummary>({
        method: 'GET',
        url: `/api/v1/ratings/reputation/${userId}`,
    });
}

/**
 * Get current user's reputation
 */
export async function getMyReputation(): Promise<ReputationSummary> {
    return apiRequest<ReputationSummary>({
        method: 'GET',
        url: '/api/v1/ratings/reputation/me',
    });
}

/**
 * Get current user's sent rating requests
 */
export async function getMyRatingRequests(
    status?: 'pending' | 'completed' | 'expired'
): Promise<RatingRequest[]> {
    try {
        return await apiRequest<RatingRequest[]>({
            method: 'GET',
            url: '/api/v1/ratings/my-requests',
            params: status ? { status_filter: status } : {},
        });
    } catch (err) {
        console.warn('Error fetching rating requests:', err);
        return [];
    }
}

/**
 * Get current user's received reviews
 */
export async function getMyReviews(): Promise<Review[]> {
    try {
        return await apiRequest<Review[]>({
            method: 'GET',
            url: '/api/v1/ratings/my-reviews',
        });
    } catch (err) {
        console.warn('Error fetching reviews:', err);
        return [];
    }
}

/**
 * Report a review for moderation
 */
export async function reportReview(data: {
    review_id: string;
    reason: string;
    details?: string;
}): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/api/v1/ratings/moderation/report',
        data,
    });
}
