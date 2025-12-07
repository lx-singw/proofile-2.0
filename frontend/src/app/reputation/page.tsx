"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Star, Users, MessageSquare, TrendingUp, Award, Send, CheckCircle } from "lucide-react";

export default function ReputationPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/reputation');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const ratings = {
        overall: 4.8,
        totalRatings: 12,
        breakdown: [
            { label: "Technical Skills", score: 4.9 },
            { label: "Communication", score: 4.7 },
            { label: "Reliability", score: 5.0 },
            { label: "Teamwork", score: 4.6 },
        ],
    };

    const recentReviews = [
        {
            author: "Sarah Johnson",
            role: "Former Manager @ TechCorp",
            rating: 5,
            text: "John is an exceptional PM. Delivered our product 2 weeks ahead of schedule and increased engagement by 40%.",
            date: "1 week ago",
        },
        {
            author: "Mike Chen",
            role: "Colleague @ TechCorp",
            rating: 5,
            text: "Great collaborator and always brings creative solutions to the table.",
            date: "2 weeks ago",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                            <Star className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Your Professional Reputation
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Build trust through peer ratings and reviews
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall Rating */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                Overall Rating
                            </h2>
                            <p className="text-sm text-gray-500">
                                Based on {ratings.totalRatings} ratings
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                {ratings.overall}/5.0
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${
                                            star <= Math.round(ratings.overall)
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-4">
                        {ratings.breakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="w-32 text-sm text-gray-600 dark:text-gray-400">
                                    {item.label}
                                </span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{ width: `${(item.score / 5) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                    {item.score}/5.0
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Recent Reviews
                    </h2>
                    <div className="space-y-4">
                        {recentReviews.map((review, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {review.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {review.author}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {review.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${
                                                    star <= review.rating
                                                        ? "text-yellow-500 fill-yellow-500"
                                                        : "text-gray-300"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-2">
                                    "{review.text}"
                                </p>
                                <p className="text-sm text-gray-400">{review.date}</p>
                            </div>
                        ))}
                    </div>
                </div>

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
                        <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                            Request from Colleague
                        </button>
                        <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Request from Manager
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
