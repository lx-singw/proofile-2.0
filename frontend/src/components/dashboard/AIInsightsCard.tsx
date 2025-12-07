"use client";

import React from "react";
import Link from "next/link";
import {
    Bot,
    Lightbulb,
    TrendingUp,
    ArrowRight,
    Sparkles,
    Target,
    Shield,
    Star,
    Plus
} from "lucide-react";

interface QuickInsight {
    id: string;
    title: string;
    description: string;
    impact: string;
    actionLink: string;
    actionLabel: string;
    priority: "high" | "medium" | "low";
}

interface AIInsightsCardProps {
    userName?: string;
    profileCompleteness?: number;
    className?: string;
}

export default function AIInsightsCard({
    userName = "there",
    profileCompleteness = 72,
    className = ""
}: AIInsightsCardProps) {
    // Mock insights - in production these would come from AI analysis API
    const insights: QuickInsight[] = [
        {
            id: "1",
            title: "Add skills to boost visibility",
            description: "Adding Product Analytics & OKRs would increase job matches by 40%",
            impact: "+40% job matches",
            actionLink: "/profile/edit",
            actionLabel: "Add Skills",
            priority: "high"
        },
        {
            id: "2",
            title: "Get verified to build trust",
            description: "Verified profiles get 3x more recruiter views",
            impact: "3x more views",
            actionLink: "/verification",
            actionLabel: "Verify Now",
            priority: "high"
        },
        {
            id: "3",
            title: "Request your first rating",
            description: "Profiles with ratings rank higher in searches",
            impact: "+25% ranking",
            actionLink: "/reputation",
            actionLabel: "Get Rated",
            priority: "medium"
        }
    ];

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "high":
                return "border-l-red-500 bg-red-50 dark:bg-red-900/10";
            case "medium":
                return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
            default:
                return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10";
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">AI Career Assistant</h3>
                            <p className="text-purple-100 text-sm">Personalized insights for you</p>
                        </div>
                    </div>
                    <Link
                        href="/ai-assistant"
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Profile Completeness */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Profile Strength
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {profileCompleteness}%
                    </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${profileCompleteness}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Complete quick wins below to reach 90%
                </p>
            </div>

            {/* Quick Insights */}
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Quick Wins
                    </span>
                </div>

                {insights.slice(0, 3).map((insight) => (
                    <div
                        key={insight.id}
                        className={`p-3 rounded-lg border-l-4 ${getPriorityStyles(insight.priority)}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {insight.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {insight.description}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{insight.impact}</span>
                                </div>
                            </div>
                            <Link
                                href={insight.actionLink}
                                className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors flex-shrink-0"
                            >
                                {insight.actionLabel} →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <Link
                    href="/ai-assistant"
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    Get Full AI Analysis
                </Link>
            </div>
        </div>
    );
}
