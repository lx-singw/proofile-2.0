"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useReputationScores } from "@/hooks/useReputationScores";

import { RateProfessionalModal } from "@/components/social/RateProfessionalModal";
import { RequestRatingModal } from "@/components/ratings/RequestRatingModal";
import RadarChart from "@/components/reputation/visuals/RadarChart";
import ReputationConstellation from "@/components/reputation/visuals/ReputationConstellation";
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/30">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
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
    })) : [];

    return (
        // 1. GRADIENT BACKGROUND - Soft emerald gradient
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/30">
            {/* Quick Stats Bar */}
            <ReputationStatsBar
                avgRating={ratings.overall}
                totalReviews={reviews?.length || 0}
                percentile={ratings.overall >= 4.5 ? 15 : ratings.overall >= 4 ? 30 : 50}
            />

            {/* 7. IMPROVED SPACING - Increased padding */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <FadeIn>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Star className="w-8 h-8 text-emerald-500 drop-shadow-lg" />
                                Your Professional Reputation
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Build trust through peer ratings and reviews
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* 4. HOVER ANIMATIONS on buttons */}
                            <Link
                                href="/reputation/request"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                            >
                                <Send className="w-4 h-4" />
                                Request Rating
                            </Link>
                            <button
                                onClick={() => setRateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                            >
                                <UserPlus className="w-4 h-4" />
                                Rate Someone
                            </button>
                            {/* 6. BUTTON GLOW EFFECT */}
                            <Link
                                href={`/p/${user?.username || 'me'}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                            >
                                <Users className="w-4 h-4" />
                                Public Profile
                            </Link>
                        </div>
                    </div>

                    {/* 2. GLASS MORPHISM + 3. ENHANCED SHADOWS + 5. BORDER ACCENT */}
                    {/* Overall Rating with Radar Chart */}
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-10 mb-10 border-l-4 border-emerald-500 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            {/* Score Badge */}
                            <div className="text-center">
                                <ScoreBadge score={ratings.overall} size="lg" />
                                <p className="text-sm text-gray-500 mt-3">
                                    Based on {ratings.totalRatings} reviews
                                </p>
                            </div>

                            {/* Radar Chart */}
                            <div className="flex-1 flex flex-col items-center gap-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Skill Breakdown</h4>
                                <RadarChart data={ratings.breakdown} size={220} />
                            </div>

                            {/* Constellation Visual */}
                            <div className="flex-1 flex flex-col items-center gap-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Social Gravity</h4>
                                <ReputationConstellation globalScore={ratings.overall} />
                            </div>
                        </div>
                    </div>

                    {/* Recent Reviews - 4. HOVER ANIMATION on section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-emerald-500" />
                            Recent Reviews
                        </h2>
                        {recentReviews.length > 0 ? (
                            <div className="space-y-5">
                                {recentReviews.map((review, idx) => (
                                    <div
                                        key={idx}
                                        className="transform hover:scale-[1.01] hover:-translate-y-1 transition-all duration-200"
                                    >
                                        <ReviewCard
                                            author={review.author}
                                            rating={review.rating}
                                            text={review.text}
                                            date={review.date}
                                            dimensions={review.dimensions}
                                            isStaked={review.isStaked}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-700">
                                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No reviews yet</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mt-1">
                                    Request ratings from your connections to start building your professional trust.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pending Requests Section */}
                    {pendingRequests.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Request History
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold">
                                                {req.invitee_name?.charAt(0) || req.invitee_email.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate">{req.invitee_name || req.invitee_email}</h4>
                                                <p className="text-xs text-gray-500 truncate">{req.relationship_type} at {req.company}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded">Pending</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(req.share_url);
                                                    // toast.success("Link copied!");
                                                }}
                                                className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-700"
                                            >
                                                <Share2 className="w-3 h-3" />
                                                Copy Link
                                            </button>
                                        </div>
                                        <div className="absolute top-0 bottom-0 right-0 w-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Career Insights - wrapped with hover effect */}
                    <div className="mb-10 transform hover:scale-[1.005] transition-all duration-200">
                        <CareerInsightsCard />
                    </div>

                    {/* Request Ratings - All enhancements combined */}
                    <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-xl rounded-2xl p-8 border-l-4 border-emerald-500 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                            <Send className="w-5 h-5 text-emerald-600" />
                            Request Ratings
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Invite colleagues, managers, or clients to rate your professional skills.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {/* 6. BUTTON GLOW EFFECTS */}
                            <button
                                onClick={() => setRequestModalOpen(true)}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Request a Rating
                            </button>
                            <button
                                onClick={() => setRateModalOpen(true)}
                                className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center gap-2"
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

