import { apiRequest } from "../lib/api";

// === Types ===

export interface ReviewRequest {
    id: string;
    work_experience_id: string;
    reviewer_email: string;
    reviewer_name: string | null;
    relationship_type: string;
    status: string;
    expires_at: string;
    reminder_sent_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    company: string | null;
    role_title: string | null;
}

export interface ReviewRequestCreate {
    work_experience_id: string;
    reviewer_email: string;
    reviewer_name?: string;
    relationship_type: string;
    personal_message?: string;
}

export interface ReviewSubmitContext {
    reviewee_name: string;
    reviewee_headline: string | null;
    company: string;
    role_title: string;
    work_period: string;
    relationship_type: string;
    reviewer_email: string;
    reviewer_name: string | null;
    is_expired: boolean;
    is_already_submitted: boolean;
}

export interface ReviewSubmitPayload {
    reviewer_name: string;
    reviewer_title: string;
    reviewer_company: string;
    star_rating: number;
    written_review: string;
    endorsed_skills: string[];
}

export interface VerifiedReview {
    id: string;
    reviewer_name: string;
    reviewer_title: string | null;
    reviewer_company: string | null;
    relationship_type: string;
    star_rating: number;
    written_review: string;
    endorsed_skills: string[];
    reviewer_has_proofile: boolean;
    completed_at: string | null;
}

export interface ScoreBreakdown {
    total_score: number;
    avg_star_rating: number;
    star_rating_component: number;
    review_count: number;
    review_count_component: number;
    avg_seniority: number;
    seniority_component: number;
    profile_completeness: number;
    completeness_component: number;
    cross_platform_bonus: number;
    cross_platform_component: number;
}

export interface PublicProfile {
    username: string;
    full_name: string | null;
    bio: string | null;
    profile_photo_url: string | null;
    headline: string | null;
    persona: string | null;
    industry: string | null;
    city: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    user_id: number;
    is_private: boolean;
    experiences: Array<{
        id: string;
        company: string;
        title: string;
        location: string | null;
        start_date: string;
        end_date: string | null;
        description: string | null;
        is_current: boolean;
        is_verified: boolean;
        reviews: VerifiedReview[];
        review_count: number;
    }>;
    skills_data: string[];
    verified_skills: Record<string, number>;
    proofile_score: number;
    score_breakdown: ScoreBreakdown | null;
    total_reviews: number;
    avg_rating: number;
    portfolio: Array<Record<string, unknown>>;
}

// === API Functions ===

const REVIEWS_PATH = "/api/v1/reviews";

/** Create a review request (authenticated) */
export async function createReviewRequest(data: ReviewRequestCreate): Promise<ReviewRequest> {
    return apiRequest<ReviewRequest>({ method: "post", url: `${REVIEWS_PATH}/request`, data });
}

/** List all review requests for current user (authenticated) */
export async function getMyReviewRequests(statusFilter?: string): Promise<ReviewRequest[]> {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    return apiRequest<ReviewRequest[]>({ method: "get", url: `${REVIEWS_PATH}/requests`, params });
}

/** Cancel a pending review request (authenticated) */
export async function cancelReviewRequest(id: string): Promise<void> {
    return apiRequest<void>({ method: "delete", url: `${REVIEWS_PATH}/requests/${id}` });
}

/** Send a reminder for a pending review request (authenticated) */
export async function sendReviewReminder(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>({ method: "post", url: `${REVIEWS_PATH}/requests/${id}/remind` });
}

/** Get review submission context (public, token-based) */
export async function getReviewContext(token: string): Promise<ReviewSubmitContext> {
    return apiRequest<ReviewSubmitContext>({ method: "get", url: `${REVIEWS_PATH}/submit/${token}` });
}

/** Submit a review (public, token-based) */
export async function submitReview(token: string, data: ReviewSubmitPayload): Promise<VerifiedReview> {
    return apiRequest<VerifiedReview>({ method: "post", url: `${REVIEWS_PATH}/submit/${token}`, data });
}

/** Get a public profile by username (no auth required) */
export async function getPublicProfile(username: string): Promise<PublicProfile> {
    return apiRequest<PublicProfile>({ method: "get", url: `/api/v1/profiles/public/${username}` });
}

const reviewsService = {
    createReviewRequest,
    getMyReviewRequests,
    cancelReviewRequest,
    sendReviewReminder,
    getReviewContext,
    submitReview,
    getPublicProfile,
};

export default reviewsService;
