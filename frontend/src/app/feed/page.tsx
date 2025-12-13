"use client";

import React, { useState } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { FeedCard, FeedItem } from "@/components/feed/FeedCard";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Users,
    Briefcase,
    TrendingUp,
    Filter,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

// Sample data (would come from API in production)
const SAMPLE_FEED: FeedItem[] = [
    {
        id: "1",
        type: "skill_verified",
        user: {
            id: 101,
            name: "Sarah Chen",
            headline: "Senior Software Engineer at Meta",
            username: "sarachen",
        },
        content: "Just got my React expertise verified! 🎉 Thanks to all my colleagues who endorsed my skills. Building great products together.",
        likes: 42,
        comments: 8,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isLiked: false,
    },
    {
        id: "2",
        type: "job_match",
        user: {
            id: 102,
            name: "Marcus Johnson",
            headline: "Product Manager | Ex-Google",
            username: "marcusj",
        },
        content: "Excited to share that I've been matched with 5 companies actively looking for PMs with my background! The Proofile matching algorithm is impressive.",
        likes: 28,
        comments: 5,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        isLiked: true,
    },
    {
        id: "3",
        type: "milestone",
        user: {
            id: 103,
            name: "Emily Watson",
            headline: "UX Designer | Design Systems",
            username: "emilyw",
        },
        content: "Reached 100% profile completion today! 🚀 All my skills verified, work history confirmed. Ready for new opportunities.",
        likes: 156,
        comments: 23,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isLiked: false,
    },
];

const SUGGESTED_PROFILES = [
    { id: 1, name: "Alex Rivera", headline: "Full Stack Developer", match: 92 },
    { id: 2, name: "Jordan Kim", headline: "Data Scientist", match: 88 },
    { id: 3, name: "Taylor Hayes", headline: "Product Designer", match: 85 },
];

export default function FeedPage() {
    const [feed, setFeed] = useState<FeedItem[]>(SAMPLE_FEED);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleLike = (id: string) => {
        setFeed(prev => prev.map(item =>
            item.id === id
                ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
                : item
        ));
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));
        setIsRefreshing(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Main Feed Column */}
                    <div className="flex-1 max-w-2xl">
                        {/* Feed Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-purple-500" />
                                Your Feed
                            </h1>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="rounded-xl"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl">
                                    <Filter className="w-4 h-4 mr-1.5" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        {/* Feed Items */}
                        <div className="space-y-4">
                            {feed.map(item => (
                                <FeedCard
                                    key={item.id}
                                    item={item}
                                    onLike={handleLike}
                                />
                            ))}
                        </div>

                        {/* Load More */}
                        <div className="mt-8 text-center">
                            <Button variant="outline" className="rounded-xl">
                                Load More
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-80 space-y-6">
                        {/* Suggested Connections */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                People You May Know
                            </h3>
                            <div className="space-y-4">
                                {SUGGESTED_PROFILES.map(profile => (
                                    <div key={profile.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {profile.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{profile.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.headline}</p>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{profile.match}%</span>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-4 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-sm">
                                View All
                            </Button>
                        </div>

                        {/* Trending Jobs */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-green-500" />
                                Jobs For You
                            </h3>
                            <div className="space-y-3">
                                <Link href="/jobs" className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Senior Frontend Engineer</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Stripe • San Francisco</p>
                                </Link>
                                <Link href="/jobs" className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Product Manager</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Notion • Remote</p>
                                </Link>
                            </div>
                            <Button variant="ghost" asChild className="w-full mt-4 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl text-sm">
                                <Link href="/jobs">Browse All Jobs</Link>
                            </Button>
                        </div>

                        {/* Trending Topics */}
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 p-5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                                Trending Now
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {["#AI", "#RemoteWork", "#TechCareers", "#ProductManagement", "#Startups"].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
