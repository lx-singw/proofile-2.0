"use client";

import React, { useState, useEffect } from "react";
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
    Plus,
    Loader2,
    Check,
    GraduationCap,
    Briefcase,
    ChevronRight
} from "lucide-react";
import aiService, { type AIProfileSuggestion } from "@/services/aiService";

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
    const [suggestions, setSuggestions] = useState<AIProfileSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [applyingId, setApplyingId] = useState<string | null>(null);

    useEffect(() => {
        aiService.getProfileSuggestions()
            .then(setSuggestions)
            .finally(() => setLoading(false));
    }, []);

    const handleApply = async (id: string) => {
        setApplyingId(id);
        const success = await aiService.applyProfileSuggestion(id);
        if (success) {
            setAppliedIds(prev => new Set(prev).add(id));
        }
        setApplyingId(null);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "headline":
                return <Star className="w-3 h-3" />;
            case "summary":
                return <Briefcase className="w-3 h-3" />;
            case "skill":
                return <Target className="w-3 h-3" />;
            case "experience":
                return <GraduationCap className="w-3 h-3" />;
            default:
                return <Lightbulb className="w-3 h-3" />;
        }
    };

    const getPriorityStyles = (type: string) => {
        switch (type) {
            case "headline":
                return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10";
            case "skill":
                return "border-l-green-500 bg-green-50 dark:bg-green-900/10";
            case "summary":
                return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/10";
            default:
                return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
        }
    };

    // Career growth opportunities based on experience level
    const careerOpportunities = [
        { role: "Senior Product Manager", readiness: 95 },
        { role: "Head of Product", readiness: 75 },
        { role: "Director of Product", readiness: 60 }
    ];

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
                            <h3 className="font-bold text-white text-lg">🤖 AI Profile Assistant</h3>
                            <p className="text-purple-100 text-sm">
                                Hi {userName}! Here's how to improve your profile
                            </p>
                        </div>
                    </div>
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
            </div>

            {/* Quick Wins - AI Suggestions */}
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        💡 Quick Wins (Do these now)
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    </div>
                ) : suggestions.length > 0 ? (
                    suggestions.slice(0, 3).map((suggestion) => (
                        <div
                            key={suggestion.id}
                            className={`p-3 rounded-lg border-l-4 ${getPriorityStyles(suggestion.type)} ${appliedIds.has(suggestion.id) ? "opacity-60" : ""
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {getTypeIcon(suggestion.type)}
                                        <span className="text-xs font-medium text-gray-500 uppercase">
                                            {suggestion.type}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {suggestion.suggestion}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                        {suggestion.reason}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>{suggestion.impact}</span>
                                    </div>
                                </div>
                                {appliedIds.has(suggestion.id) ? (
                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                        <Check className="w-3 h-3" />
                                        Applied
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleApply(suggestion.id)}
                                        disabled={applyingId === suggestion.id}
                                        className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                                    >
                                        {applyingId === suggestion.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            "Apply →"
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-gray-500 text-center py-3">
                        🎉 Great job! Your profile is looking strong.
                    </div>
                )}
            </div>

            {/* Career Growth Opportunities */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        🎯 Career Growth Opportunities
                    </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Based on your skills and experience, you're ready for:
                </p>
                <div className="space-y-2">
                    {careerOpportunities.map((opp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{opp.role}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${opp.readiness}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    {opp.readiness}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <Link
                    href="/ai-assistant"
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    Ask AI Anything About Your Career
                </Link>
            </div>
        </div>
    );
}
