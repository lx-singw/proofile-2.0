"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import analyticsService, { type AnalyticsSummary, type CareerInsight } from "@/services/analyticsService";

import { BarChart3, TrendingUp, Users, Briefcase, Eye, Search, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import QuickStatsBar from "@/components/ui/QuickStatsBar";
import { FadeIn } from "@/components/ui/PageTransition";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AnalyticsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
    const [insights, setInsights] = React.useState<CareerInsight[]>([]);
    const [period, setPeriod] = React.useState<"7d" | "30d" | "90d">("7d");
    const [isLoading, setIsLoading] = React.useState(true);

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/analytics');
        }
    }, [user, authLoading, router]);

    // Fetch analytics data
    React.useEffect(() => {
        if (user) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [summaryData, insightsData] = await Promise.all([
                        analyticsService.getAnalyticsSummary(period),
                        analyticsService.getCareerInsights()
                    ]);
                    setSummary(summaryData);
                    setInsights(insightsData);
                } catch (error) {
                    console.error("Failed to fetch analytics:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [user, period]);

    if (authLoading || (isLoading && !summary)) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!user) return null;

    const statsGrid = [
        { label: "Profile Views", value: summary?.totalViews || 0, icon: Eye, color: "blue", trend: "+12%" },
        { label: "Search Appearances", value: summary?.searchAppearances || 0, icon: Search, color: "emerald", trend: "+5%" },
        { label: "Connections", value: summary?.connections || 0, icon: Users, color: "purple", trend: "+2" },
        { label: "Avg. Rating", value: summary?.avgRating || 0, icon: BarChart3, color: "amber", trend: "0.0" },
    ];

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
                {/* Quick Stats Bar */}
                <QuickStatsBar
                    stats={[
                        { label: "Profile Views", value: summary?.totalViews || 0, trend: "up" },
                        { label: "Search App.", value: summary?.searchAppearances || 0 },
                        { label: "Rating", value: summary?.avgRating || 0 },
                    ]}
                />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <FadeIn>
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <BarChart3 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Analytics Dashboard
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Track your career metrics and visibility
                                    </p>
                                </div>
                            </div>

                            {/* Period Selector */}
                            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                                {(["7d", "30d", "90d"] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${period === p
                                                ? "bg-emerald-600 text-white shadow-sm"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            }`}
                                    >
                                        {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Top Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {statsGrid.map((stat, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                                            <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            {stat.trend}
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                        {typeof stat.value === "number" && stat.label === "Avg. Rating" ? stat.value.toFixed(1) : stat.value}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Career Insights Section */}
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    Career Insights
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {insights.length > 0 ? (
                                        insights.map((insight) => (
                                            <div
                                                key={insight.id}
                                                className="bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4 border-l-emerald-500 border border-gray-200 dark:border-gray-700 shadow-sm hover:translate-y-[-2px] transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${insight.type === 'skill_gap' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            insight.type === 'opportunity' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                        {insight.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                                    {insight.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                                    {insight.description}
                                                </p>
                                                {insight.actionUrl && (
                                                    <Link
                                                        href={insight.actionUrl}
                                                        className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                    >
                                                        {insight.actionLabel || "Take action"}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
                                            Collecting more data to generate insights...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Traffic Sources */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                    Top Referrers
                                </h2>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="space-y-4">
                                        {summary?.topReferrers && summary.topReferrers.length > 0 ? (
                                            summary.topReferrers.map((referrer, idx) => (
                                                <div key={idx} className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {referrer.source}
                                                        </span>
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {referrer.count} views
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-emerald-500 h-full rounded-full"
                                                            style={{
                                                                width: `${Math.min((referrer.count / (summary?.totalViews || 1)) * 100, 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-center text-gray-500 py-4">
                                                No referrer data available yet.
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                                            💡 Profiles with a custom username get 40% more direct traffic.
                                        </p>
                                        <Link
                                            href="/profile"
                                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 block hover:underline"
                                        >
                                            Set your username →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Area - Placeholder for now as Recharts needs installation or more setup */}
                        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Visibility Over Time
                            </h2>
                            <div className="h-64 flex items-end justify-between gap-2">
                                {summary?.viewsTrend.map((item, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-t-lg group-hover:bg-emerald-500 transition-colors relative"
                                            style={{ height: `${Math.max((item.views / 50) * 100, 5)}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none transition-opacity">
                                                {item.views} views
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                            {item.date}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </main>
            </div>
        </DashboardLayout>
    );
}
