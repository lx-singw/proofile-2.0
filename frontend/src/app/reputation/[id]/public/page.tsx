'use client';

/**
 * Public Reputation Profile Page
 * 
 * Displays a user's public reputation:
 * - Overall score and badge
 * - Radar chart of dimensions
 * - Public reviews (respecting anonymity)
 */

import React, { useState, useEffect } from 'react';
import {
    Star, Shield, Users, TrendingUp, Award, Share2,
    ChevronDown, Filter, Loader2
} from 'lucide-react';
import RadarChart from '@/components/reputation/visuals/RadarChart';
import ScoreBadge from '@/components/reputation/visuals/ScoreBadge';
import ReviewCard from '@/components/reputation/feed/ReviewCard';

interface ReputationData {
    user: {
        id: number;
        name: string;
        title: string;
        avatarUrl?: string;
    };
    scores: {
        global: number;
        percentile: number;
        totalReviews: number;
        verifiedReviews: number;
        dimensions: { label: string; value: number }[];
    };
    reviews: Array<{
        id: string;
        author: {
            name: string;
            role: string;
            isVerified: boolean;
        };
        rating: number;
        text: string;
        date: string;
        dimensions: { label: string; score: number }[];
        isStaked: boolean;
    }>;
    signals: string[];
}

export default function PublicReputationPage({
    params
}: {
    params: { id: string }
}) {
    const [data, setData] = useState<ReputationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'manager' | 'peer'>('all');

    useEffect(() => {
        fetchReputation();
    }, [params.id]);

    const fetchReputation = async () => {
        try {
            const response = await fetch(`/api/v1/ratings/reputation/${params.id}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();

            // Transform API response to component format
            setData({
                user: {
                    id: parseInt(params.id),
                    name: result.user_name || 'Professional',
                    title: result.user_title || '',
                    avatarUrl: result.avatar_url,
                },
                scores: {
                    global: result.global_score || 0,
                    percentile: result.percentile || 0,
                    totalReviews: result.total_reviews || 0,
                    verifiedReviews: result.verified_count || 0,
                    dimensions: Object.entries(result.dimension_scores || {}).map(
                        ([key, val]: [string, any]) => ({
                            label: key.charAt(0).toUpperCase() + key.slice(1),
                            value: val.score || val,
                        })
                    ),
                },
                reviews: result.recent_reviews || [],
                signals: result.signals || [],
            });
        } catch (error) {
            console.error('Error fetching reputation:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Reputation profile not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-start justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {data.user.avatarUrl ? (
                                <img src={data.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                data.user.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.user.name}
                            </h1>
                            <p className="text-gray-500">{data.user.title}</p>
                            <div className="flex items-center gap-3 mt-2">
                                {data.signals.includes('identity_verified') && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                        <Shield className="h-3 w-3" /> Identity Verified
                                    </span>
                                )}
                                {data.signals.includes('top_rated') && (
                                    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                                        <Award className="h-3 w-3" /> Top Rated
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Score Badge */}
                    <div className="text-right">
                        <ScoreBadge score={data.scores.global} size="lg" />
                        <p className="text-sm text-gray-500 mt-2">
                            Top {100 - data.scores.percentile}% of professionals
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {data.scores.totalReviews}
                        </p>
                        <p className="text-sm text-gray-500">Total Reviews</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {data.scores.verifiedReviews}
                        </p>
                        <p className="text-sm text-gray-500">Verified</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {data.scores.percentile}%
                        </p>
                        <p className="text-sm text-gray-500">Percentile</p>
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            {data.scores.dimensions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                        Skill Breakdown
                    </h2>
                    <div className="flex justify-center">
                        <RadarChart data={data.scores.dimensions} size={300} />
                    </div>
                </div>
            )}

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Reviews ({data.reviews.length})
                    </h2>

                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="text-sm border-none bg-transparent text-gray-600 dark:text-gray-400 focus:ring-0"
                        >
                            <option value="all">All Reviews</option>
                            <option value="manager">Managers Only</option>
                            <option value="peer">Peers Only</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {data.reviews.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            No public reviews yet
                        </p>
                    ) : (
                        data.reviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                author={review.author}
                                rating={review.rating}
                                text={review.text}
                                date={review.date}
                                dimensions={review.dimensions}
                                isStaked={review.isStaked}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
