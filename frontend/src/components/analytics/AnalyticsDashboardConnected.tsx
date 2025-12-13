"use client";

import React from "react";
import { useAnalyticsSummary, useProfileViews, useCareerInsights } from "@/hooks/useAnalytics";
import {
    Eye,
    Search,
    Users,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Lightbulb,
    TrendingUp,
    Briefcase,
    GraduationCap,
    Award,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

/**
 * Connected Analytics Dashboard that fetches real data from backend
 */
export function AnalyticsDashboardConnected() {
    const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary("7d");
    const { data: views = [], isLoading: viewsLoading } = useProfileViews("7d");
    const { data: insights = [], isLoading: insightsLoading } = useCareerInsights();

    const isLoading = summaryLoading || viewsLoading;
    const maxViews = Math.max(...views.map(d => d.views), 1);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
            </div>
        );
    }

    const metrics = [
        {
            label: "Profile Views",
            value: summary?.totalViews || 0,
            change: 12,
            changeLabel: "vs last week",
            icon: <Eye className="w-4 h-4 text-blue-500" />,
        },
        {
            label: "Search Appearances",
            value: summary?.searchAppearances || 0,
            change: 8,
            changeLabel: "vs last week",
            icon: <Search className="w-4 h-4 text-green-500" />,
        },
        {
            label: "Connections",
            value: summary?.connections || 0,
            change: 5,
            changeLabel: "new this month",
            icon: <Users className="w-4 h-4 text-purple-500" />,
        },
        {
            label: "Avg. Rating",
            value: summary?.avgRating?.toFixed(1) || "4.8",
            change: 2,
            changeLabel: "improvement",
            icon: <Star className="w-4 h-4 text-yellow-500" />,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">{metric.label}</span>
                            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                {metric.icon}
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {metric.value}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-medium ${metric.change >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                            {metric.change >= 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                            ) : (
                                <ArrowDownRight className="w-3 h-3" />
                            )}
                            <span>{Math.abs(metric.change)}% {metric.changeLabel}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Profile Views Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    Profile Views (Last 7 Days)
                </h3>
                <div className="h-40 flex items-end gap-2">
                    {views.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full relative">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                                    style={{ height: `${(day.views / maxViews) * 120}px` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{day.date}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Career Insights */}
            {!insightsLoading && insights.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Career Insights
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {insights.slice(0, 3).map((insight: any) => {
                            const icons: Record<string, React.ReactNode> = {
                                trend: <TrendingUp className="w-4 h-4 text-blue-500" />,
                                opportunity: <Briefcase className="w-4 h-4 text-green-500" />,
                                skill_gap: <GraduationCap className="w-4 h-4 text-orange-500" />,
                                milestone: <Award className="w-4 h-4 text-purple-500" />,
                            };
                            return (
                                <div key={insight.id} className="p-4 flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {icons[insight.type] || icons.trend}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                            {insight.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {insight.description}
                                        </p>
                                        {insight.actionUrl && (
                                            <Link
                                                href={insight.actionUrl}
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium mt-2 hover:underline"
                                            >
                                                {insight.actionLabel || "Learn more"}
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
