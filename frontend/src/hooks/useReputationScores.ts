/**
 * useReputationScores - Hook for fetching and managing reputation data
 * 
 * Provides:
 * - Reputation summary (score, percentile, dimensions)
 * - Reviews list with filtering
 * - Rating requests status
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getMyReputation,
    getMyReviews,
    getMyRatingRequests,
    ReputationSummary,
    Review,
    RatingRequest,
} from '@/services/reputationService';

interface UseReputationScoresResult {
    // Data
    reputation: ReputationSummary | null;
    reviews: Review[];
    requests: RatingRequest[];

    // Loading states
    loading: boolean;
    reviewsLoading: boolean;
    requestsLoading: boolean;

    // Error states
    error: string | null;

    // Actions
    refresh: () => Promise<void>;
    refreshReviews: () => Promise<void>;
    refreshRequests: () => Promise<void>;

    // Computed
    hasReputation: boolean;
    pendingRequests: RatingRequest[];
    completedRequests: RatingRequest[];
}

export function useReputationScores(): UseReputationScoresResult {
    const [reputation, setReputation] = useState<ReputationSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [requests, setRequests] = useState<RatingRequest[]>([]);

    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReputation = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMyReputation();
            setReputation(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reputation');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReviews = useCallback(async () => {
        try {
            setReviewsLoading(true);
            const data = await getMyReviews();
            setReviews(data);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    }, []);

    const fetchRequests = useCallback(async () => {
        try {
            setRequestsLoading(true);
            const data = await getMyRatingRequests();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load requests:', err);
        } finally {
            setRequestsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        await Promise.all([
            fetchReputation(),
            fetchReviews(),
            fetchRequests(),
        ]);
    }, [fetchReputation, fetchReviews, fetchRequests]);

    useEffect(() => {
        refresh();
    }, []);

    // Computed values
    const hasReputation = reputation !== null && reputation.total_reviews > 0;
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const completedRequests = requests.filter(r => r.status === 'completed');

    return {
        reputation,
        reviews,
        requests,
        loading,
        reviewsLoading,
        requestsLoading,
        error,
        refresh,
        refreshReviews: fetchReviews,
        refreshRequests: fetchRequests,
        hasReputation,
        pendingRequests,
        completedRequests,
    };
}

export default useReputationScores;
