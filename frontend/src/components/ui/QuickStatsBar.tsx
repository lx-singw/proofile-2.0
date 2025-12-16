"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatItem {
    label: string;
    value: string | number;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    href?: string;
}

interface QuickStatsBarProps {
    stats: StatItem[];
    className?: string;
}

/**
 * QuickStatsBar - Compact horizontal stats display
 * 
 * Features:
 * - Animated counters
 * - Trend indicators (up/down/neutral)
 * - Clickable to navigate to details
 * - Responsive (scroll on mobile)
 */
export default function QuickStatsBar({ stats, className = "" }: QuickStatsBarProps) {
    if (!stats || stats.length === 0) return null;

    return (
        <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6 py-3 overflow-x-auto scrollbar-hide">
                    {stats.map((stat, index) => {
                        const content = (
                            <div className="flex items-center gap-2 whitespace-nowrap group">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {stat.label}:
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {stat.value}
                                </span>
                                {stat.trend && (
                                    <span className={`flex items-center text-xs ${stat.trend === "up"
                                            ? "text-green-600"
                                            : stat.trend === "down"
                                                ? "text-red-600"
                                                : "text-gray-400"
                                        }`}>
                                        {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
                                        {stat.trend === "down" && <TrendingDown className="w-3 h-3" />}
                                        {stat.trend === "neutral" && <Minus className="w-3 h-3" />}
                                        {stat.trendValue && <span className="ml-0.5">{stat.trendValue}</span>}
                                    </span>
                                )}

                                {/* Separator */}
                                {index < stats.length - 1 && (
                                    <span className="text-gray-300 dark:text-gray-600 ml-4">•</span>
                                )}
                            </div>
                        );

                        if (stat.href) {
                            return (
                                <Link key={index} href={stat.href} className="hover:opacity-80 transition-opacity">
                                    {content}
                                </Link>
                            );
                        }

                        return <div key={index}>{content}</div>;
                    })}
                </div>
            </div>
        </div>
    );
}

// Pre-built stat configurations for each page
export function JobsStatsBar({
    matchesToday = 0,
    saved = 0,
    profileMatch = 0
}: {
    matchesToday?: number;
    saved?: number;
    profileMatch?: number;
}) {
    return (
        <QuickStatsBar
            stats={[
                { label: "Matches today", value: matchesToday, trend: matchesToday > 0 ? "up" : "neutral", href: "/jobs" },
                { label: "Saved", value: saved, href: "/jobs/saved" },
                { label: "Profile match", value: `${profileMatch}%`, trend: profileMatch >= 80 ? "up" : profileMatch >= 50 ? "neutral" : "down" },
            ]}
        />
    );
}

export function ReputationStatsBar({
    avgRating = 0,
    totalReviews = 0,
    percentile = 0
}: {
    avgRating?: number;
    totalReviews?: number;
    percentile?: number;
}) {
    return (
        <QuickStatsBar
            stats={[
                { label: "Average", value: `${avgRating.toFixed(1)}/5`, trend: avgRating >= 4 ? "up" : avgRating >= 3 ? "neutral" : "down" },
                { label: "Reviews", value: totalReviews, href: "/reputation" },
                { label: "Ranking", value: `Top ${percentile}%`, trend: percentile <= 25 ? "up" : "neutral" },
            ]}
        />
    );
}

export function VerificationStatsBar({
    verifiedPercent = 0,
    pending = 0
}: {
    verifiedPercent?: number;
    pending?: number;
}) {
    return (
        <QuickStatsBar
            stats={[
                { label: "Verified", value: `${verifiedPercent}%`, trend: verifiedPercent >= 75 ? "up" : verifiedPercent >= 50 ? "neutral" : "down" },
                { label: "Pending", value: pending, trend: pending > 0 ? "neutral" : "up" },
                { label: "Trust level", value: verifiedPercent >= 75 ? "High" : verifiedPercent >= 50 ? "Medium" : "Low" },
            ]}
        />
    );
}

export function ProfileStatsBar({
    completeness = 0,
    viewsToday = 0,
    connections = 0
}: {
    completeness?: number;
    viewsToday?: number;
    connections?: number;
}) {
    return (
        <QuickStatsBar
            stats={[
                { label: "Complete", value: `${completeness}%`, trend: completeness >= 80 ? "up" : completeness >= 50 ? "neutral" : "down", href: "/settings?tab=profile" },
                { label: "Views today", value: viewsToday, trend: viewsToday > 0 ? "up" : "neutral" },
                { label: "Connections", value: connections, href: "/profile" },
            ]}
        />
    );
}
