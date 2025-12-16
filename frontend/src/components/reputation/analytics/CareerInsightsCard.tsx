"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Target, Lightbulb, ChevronRight, Award, Users, BarChart2 } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";

interface GrowthDataPoint {
    period: string;
    score: number;
    review_count: number;
}

interface DimensionPercentile {
    dimension: string;
    your_score: number;
    market_average: number;
    percentile: number;
    trend: string;
    suggestion: string | null;
}

interface Suggestion {
    title: string;
    description: string;
    action_type: string;
    priority: string;
    link: string | null;
}

interface InsightsData {
    growth: {
        current_score: number;
        change_last_month: number;
        change_last_year: number;
        data_points: GrowthDataPoint[];
        milestone: string | null;
    } | null;
    comparison: {
        dimensions: DimensionPercentile[];
        top_strengths: string[];
        growth_areas: string[];
    } | null;
    suggestions: Suggestion[];
}

export default function CareerInsightsCard() {
    const [data, setData] = useState<InsightsData>({
        growth: null,
        comparison: null,
        suggestions: [],
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"growth" | "comparison" | "suggestions">("growth");

    useEffect(() => {
        async function fetchInsights() {
            try {
                const [growthRes, comparisonRes, suggestionsRes] = await Promise.all([
                    fetch("/api/v1/ratings/insights/growth", { credentials: "include" }),
                    fetch("/api/v1/ratings/insights/market-comparison", { credentials: "include" }),
                    fetch("/api/v1/ratings/insights/suggestions", { credentials: "include" }),
                ]);

                const growth = growthRes.ok ? await growthRes.json() : null;
                const comparison = comparisonRes.ok ? await comparisonRes.json() : null;
                const suggestionsData = suggestionsRes.ok ? await suggestionsRes.json() : { suggestions: [] };

                setData({
                    growth,
                    comparison,
                    suggestions: suggestionsData.suggestions || [],
                });
            } catch (error) {
                console.error("Failed to fetch insights:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "growth" as const, label: "Your Growth", icon: TrendingUp },
        { id: "comparison" as const, label: "Market Position", icon: Target },
        { id: "suggestions" as const, label: "Suggestions", icon: Lightbulb },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 p-4 pb-0">
                    <BarChart2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Career Insights</h3>
                </div>
                <div className="flex gap-1 px-4 mt-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id
                                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Growth Tab */}
                {activeTab === "growth" && (
                    <div>
                        {data.growth ? (
                            <>
                                {/* Score Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {data.growth.current_score.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-500">Current Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${data.growth.change_last_month >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {data.growth.change_last_month >= 0 ? "+" : ""}{data.growth.change_last_month.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500">This Month</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${data.growth.change_last_year >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {data.growth.change_last_year >= 0 ? "+" : ""}{data.growth.change_last_year.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500">This Year</div>
                                    </div>
                                </div>

                                {/* Milestone */}
                                {data.growth.milestone && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 p-4 rounded-lg mb-6">
                                        <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                                            {data.growth.milestone}
                                        </p>
                                    </div>
                                )}

                                {/* Chart */}
                                {data.growth.data_points.length > 0 ? (
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.growth.data_points}>
                                                <defs>
                                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1f2937",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        color: "#fff",
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#6366F1"
                                                    strokeWidth={2}
                                                    fill="url(#scoreGradient)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>Not enough data yet. Get more ratings to see your growth!</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Unable to load growth data</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Comparison Tab */}
                {activeTab === "comparison" && (
                    <div>
                        {data.comparison ? (
                            <>
                                {/* Strengths & Growth Areas */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="w-5 h-5 text-green-600" />
                                            <span className="font-medium text-green-800 dark:text-green-300">
                                                Top Strengths
                                            </span>
                                        </div>
                                        <ul className="space-y-1">
                                            {data.comparison.top_strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-green-700 dark:text-green-400">
                                                    • {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-5 h-5 text-emerald-600" />
                                            <span className="font-medium text-emerald-800 dark:text-emerald-300">
                                                Growth Areas
                                            </span>
                                        </div>
                                        <ul className="space-y-1">
                                            {data.comparison.growth_areas.map((s, i) => (
                                                <li key={i} className="text-sm text-emerald-700 dark:text-emerald-400">
                                                    • {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Dimension Bars */}
                                <div className="space-y-3">
                                    {data.comparison.dimensions.slice(0, 5).map((dim) => (
                                        <div key={dim.dimension}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {dim.dimension}
                                                </span>
                                                <span className="text-gray-500">
                                                    Top {100 - dim.percentile}%
                                                </span>
                                            </div>
                                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`absolute h-full rounded-full transition-all ${dim.percentile >= 70
                                                            ? "bg-green-500"
                                                            : dim.percentile >= 40
                                                                ? "bg-emerald-500"
                                                                : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${dim.percentile}%` }}
                                                />
                                                {/* Market average marker */}
                                                <div
                                                    className="absolute w-0.5 h-4 -top-1 bg-gray-800 dark:bg-gray-300"
                                                    style={{ left: `${(dim.market_average / 5) * 100}%` }}
                                                    title={`Market avg: ${dim.market_average}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>Get more ratings to see how you compare!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Suggestions Tab */}
                {activeTab === "suggestions" && (
                    <div className="space-y-3">
                        {data.suggestions.length > 0 ? (
                            data.suggestions.map((suggestion, i) => (
                                <a
                                    key={i}
                                    href={suggestion.link || "#"}
                                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                >
                                    <div
                                        className={`p-2 rounded-lg ${suggestion.priority === "high"
                                                ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                                : suggestion.priority === "medium"
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                                    : "bg-green-100 dark:bg-green-900/30 text-green-600"
                                            }`}
                                    >
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {suggestion.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {suggestion.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                </a>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No suggestions at the moment. You're doing great!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
