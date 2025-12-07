"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Search, Users, TrendingUp, MapPin, Briefcase, Star, Shield } from "lucide-react";

export default function DiscoverPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/discover');
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

    const trendingCategories = [
        { label: "Top Product Managers", icon: TrendingUp, count: 234 },
        { label: "Rising Software Engineers", icon: Users, count: 567 },
        { label: "Verified Design Leaders", icon: Shield, count: 123 },
        { label: "Top Rated in Tech", icon: Star, count: 89 },
    ];

    const featuredProfiles = [
        { name: "Sarah Chen", role: "Senior PM @ Google", rating: 4.9, verified: true },
        { name: "Mike Johnson", role: "Staff Engineer @ Meta", rating: 4.8, verified: true },
        { name: "Emily Davis", role: "Design Lead @ Airbnb", rating: 5.0, verified: true },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Discover Professionals
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Find and connect with verified professionals in your industry
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by skills, role, company, or location..."
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                {/* Trending Categories */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        🔥 Trending Profiles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {trendingCategories.map((cat, idx) => (
                            <button
                                key={idx}
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <cat.icon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-sm text-gray-500">{cat.count} profiles</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {cat.label}
                                </h3>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Profiles */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        🌟 Featured Professionals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {featuredProfiles.map((profile, idx) => (
                            <div
                                key={idx}
                                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {profile.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {profile.name}
                                            {profile.verified && (
                                                <Shield className="w-4 h-4 text-green-500" />
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {profile.role}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {profile.rating}/5.0
                                        </span>
                                    </div>
                                    <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                                        View Profile →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        🚀 More Discovery Features Coming Soon
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                        Advanced filters, mutual connections, industry insights, and more are on the way.
                    </p>
                </div>
            </main>
        </div>
    );
}
