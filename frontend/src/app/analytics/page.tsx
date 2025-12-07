"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { BarChart3, TrendingUp, Users, Briefcase, Eye, Search, Building2, Calendar } from "lucide-react";

export default function AnalyticsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/analytics');
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

    const stats = [
        { label: "Profile Views", value: 234, change: "+23%", icon: Eye, color: "blue" },
        { label: "Job Matches", value: 45, change: "+12%", icon: Briefcase, color: "green" },
        { label: "Applications", value: 12, change: "+5%", icon: TrendingUp, color: "purple" },
    ];

    const topViewers = [
        { company: "Google", views: 15 },
        { company: "Meta", views: 12 },
        { company: "Amazon", views: 10 },
        { company: "Microsoft", views: 8 },
        { company: "Apple", views: 6 },
    ];

    const searchTerms = [
        { term: "Product Manager SaaS", count: 34 },
        { term: "Senior PM San Francisco", count: 28 },
        { term: "Agile Product Management", count: 22 },
        { term: "Tech Product Lead", count: 18 },
    ];

    const viewerBreakdown = [
        { label: "Recruiters", percentage: 45 },
        { label: "Hiring Managers", percentage: 30 },
        { label: "Peers", percentage: 15 },
        { label: "Others", percentage: 10 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <BarChart3 className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Profile Analytics
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Track your professional presence and engagement
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                </div>
                                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {stat.change}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Who's Viewing */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Who's Viewing Your Profile
                        </h2>
                        <div className="space-y-4">
                            {viewerBreakdown.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <span className="w-32 text-sm text-gray-600 dark:text-gray-400">
                                        {item.label}
                                    </span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                        {item.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Companies */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Top Companies Viewing
                        </h2>
                        <div className="space-y-3">
                            {topViewers.map((viewer, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-500">
                                            {idx + 1}.
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {viewer.company}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {viewer.views} views
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search Terms */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Search Terms Finding You
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchTerms.map((term, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                                >
                                    <span className="text-gray-700 dark:text-gray-300">
                                        "{term.term}"
                                    </span>
                                    <span className="text-sm font-medium text-indigo-600">
                                        {term.count} times
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-8 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        📊 Advanced Analytics Coming Soon
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                        Time-based trends, engagement metrics, comparison insights, and more detailed reports are on the way.
                    </p>
                </div>
            </main>
        </div>
    );
}
