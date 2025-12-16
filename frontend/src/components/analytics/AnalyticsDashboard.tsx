"use client";

import React from "react";
import {
    TrendingUp,
    TrendingDown,
    Eye,
    Users,
    Search,
    Star,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

interface MetricCard {
    label: string;
    value: string | number;
    change: number;
    changeLabel: string;
    icon: React.ReactNode;
}

interface AnalyticsDashboardProps {
    metrics: MetricCard[];
    profileViews: { date: string; views: number }[];
    isLoading?: boolean;
}

export function AnalyticsDashboard({ metrics, profileViews, isLoading }: AnalyticsDashboardProps) {
    const maxViews = Math.max(...profileViews.map(d => d.views), 1);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
            </div>
        );
    }

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
                    {profileViews.map((day, idx) => (
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
        </div>
    );
}

// Sample data generator
export function generateSampleMetrics(): MetricCard[] {
    return [
        {
            label: "Profile Views",
            value: 234,
            change: 12,
            changeLabel: "vs last week",
            icon: <Eye className="w-4 h-4 text-blue-500" />,
        },
        {
            label: "Search Appearances",
            value: 89,
            change: 8,
            changeLabel: "vs last week",
            icon: <Search className="w-4 h-4 text-green-500" />,
        },
        {
            label: "Connections",
            value: 156,
            change: 5,
            changeLabel: "new this month",
            icon: <Users className="w-4 h-4 text-purple-500" />,
        },
        {
            label: "Avg. Rating",
            value: "4.8",
            change: 2,
            changeLabel: "improvement",
            icon: <Star className="w-4 h-4 text-yellow-500" />,
        },
    ];
}

export function generateSampleViewsData(): { date: string; views: number }[] {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map(day => ({
        date: day,
        views: Math.floor(Math.random() * 50) + 10,
    }));
}
