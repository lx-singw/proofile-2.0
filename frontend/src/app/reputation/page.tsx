"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useReputationScores } from "@/hooks/useReputationScores";

import { RateProfessionalModal } from "@/components/social/RateProfessionalModal";
import { RequestRatingModal } from "@/components/ratings/RequestRatingModal";
import RadarChart from "@/components/reputation/visuals/RadarChart";
import ReviewCard from "@/components/reputation/feed/ReviewCard";
import ScoreBadge from "@/components/reputation/visuals/ScoreBadge";
import TrendLine from "@/components/reputation/visuals/TrendLine";
import CareerInsightsCard from "@/components/reputation/analytics/CareerInsightsCard";
import { ReputationStatsBar } from "@/components/ui/QuickStatsBar";
import { ReputationFAB } from "@/components/ui/FloatingActionButton";
import { FadeIn } from "@/components/ui/PageTransition";
import HelpTooltip, { HELP_CONTENT } from "@/components/ui/HelpTooltip";
import { Star, Users, MessageSquare, TrendingUp, Award, Send, CheckCircle, UserPlus, Share2, Loader2 } from "lucide-react";

export default function ReputationPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const {
        reputation,
        reviews,
        loading: reputationLoading,
        hasReputation,
        pendingRequests
    } = useReputationScores();

    // Hooks must be called before any conditional returns
    const [rateModalOpen, setRateModalOpen] = useState(false);
    const [requestModalOpen, setRequestModalOpen] = useState(false);

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/reputation');
        }
    }, [user, authLoading, router]);

    if (authLoading || reputationLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-600 mx-auto mb-2" />
                    <p className="text-gray-500">Loading your reputation...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Use real data if available, otherwise use mock data
    const ratings = reputation ? {
        overall: reputation.global_score || 0,
        totalRatings: reputation.total_reviews || 0,
        breakdown: Object.entries(reputation.dimension_scores || {}).map(([key, value]: [string, any]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: typeof value === 'object' ? value.score : value,
        })),
        percentile: reputation.percentile || 50,
        level: reputation.level || 'newcomer',
    } : {
        overall: 4.8,
        totalRatings: 12,
        breakdown: [
            { label: "Technical", value: 4.9 },
            { label: "Communication", value: 4.7 },
            { label: "Reliability", value: 5.0 },
            { label: "Teamwork", value: 4.6 },
            { label: "Leadership", value: 4.5 },
        ],
        percentile: 95,
        level: 'elite',
    };

    // Use real reviews if available
    const recentReviews = reviews.length > 0 ? reviews.map(r => ({
        author: r.author || { name: "Anonymous", role: r.relationship_type || "Peer", isVerified: false },
        rating: r.overall_score,
        text: r.text_content || "",
        date: new Date(r.created_at).toLocaleDateString(),
        dimensions: Object.entries(r.dimensions || {}).map(([label, score]) => ({ label, score: score as number })),
        isStaked: false,
    })) : [
        {
            author: { name: "Sarah Johnson", role: "Former Manager @ TechCorp", isVerified: true },
            rating: 5,
            text: "John is an exceptional PM. Delivered our product 2 weeks ahead of schedule and increased engagement by 40%.",
            date: "1 week ago",
            dimensions: [{ label: "Reliability", score: 5.0 }, { label: "Communication", score: 5.0 }],
            isStaked: true,
            stakedPoints: 50,
        },
        {
            author: { name: "Mike Chen", role: "Colleague @ TechCorp", isVerified: true },
            rating: 5,
            text: "Great collaborator and always brings creative solutions to the table.",
            date: "2 weeks ago",
            dimensions: [{ label: "Teamwork", score: 4.8 }],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Quick Stats Bar */}
            <ReputationStatsBar
                avgRating={ratings.overall}
                totalReviews={reviews?.length || 0}
                percentile={ratings.overall >= 4.5 ? 15 : ratings.overall >= 4 ? 30 : 50}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FadeIn>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Star className="w-8 h-8 text-yellow-500" />
                                Your Professional Reputation
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Build trust through peer ratings and reviews
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/reputation/request"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Request Rating
                            </Link>
                            <button
                                onClick={() => setRateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Rate Someone
                            </button>
                            <Link
                                href={`/p/${user?.username || 'me'}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                Public Profile
                            </Link>
                        </div>
                    </div>

                    {/* Overall Rating with Radar Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Score Badge */}
                            <div className="text-center">
                                <ScoreBadge score={ratings.overall} size="lg" />
                                <p className="text-sm text-gray-500 mt-2">
                                    Based on {ratings.totalRatings} reviews
                                </p>
                            </div>

                            {/* Radar Chart */}
                            <div className="flex-1 flex justify-center">
                                <RadarChart data={ratings.breakdown} size={220} />
                            </div>
                        </div>
                    </div>

                    {/* Recent Reviews */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Recent Reviews
                        </h2>
                        <div className="space-y-4">
                            {recentReviews.map((review, idx) => (
                                <ReviewCard
                                    key={idx}
                                    author={review.author}
                                    rating={review.rating}
                                    text={review.text}
                                    date={review.date}
                                    dimensions={review.dimensions}
                                    isStaked={review.isStaked}
                                    stakedPoints={review.stakedPoints}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Career Insights */}
                    <CareerInsightsCard />

                    {/* Request Ratings */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Request Ratings
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Invite colleagues, managers, or clients to rate your professional skills.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setRequestModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Request a Rating
                            </button>
                            <button
                                onClick={() => setRateModalOpen(true)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Rate Someone
                            </button>
                        </div>
                    </div>
                </FadeIn>
            </main>

            <RateProfessionalModal
                isOpen={rateModalOpen}
                onClose={() => setRateModalOpen(false)}
                onSuccess={() => setRateModalOpen(false)}
            />

            <RequestRatingModal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                onSuccess={() => setRequestModalOpen(false)}
            />

            {/* Mobile FAB */}
            <ReputationFAB onRequestRating={() => setRequestModalOpen(true)} />
        </div>
    );
}
