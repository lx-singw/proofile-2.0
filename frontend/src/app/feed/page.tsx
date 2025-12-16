"use client";

import React, { useState } from "react";
import Link from "next/link";

import { FeedCard, FeedItem } from "@/components/feed/FeedCard";
import { CreatePostComposer, PostType, PostVisibility } from "@/components/feed/CreatePostComposer";
import { FeedLeftSidebar } from "@/components/feed/FeedLeftSidebar";
import { FeedRightSidebar } from "@/components/feed/FeedRightSidebar";
import { Button } from "@/components/ui/button";
import QuickStatsBar from "@/components/ui/QuickStatsBar";
import { FadeIn } from "@/components/ui/PageTransition";
import {
    Sparkles,
    Users,
    Briefcase,
    TrendingUp,
    Filter,
    RefreshCw,
    Rss,
    Shield,
    Home,
    Compass
} from "lucide-react";

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
    { id: "1", name: "Alex Rivera", headline: "Full Stack Developer", matchScore: 92 },
    { id: "2", name: "Jordan Kim", headline: "Data Scientist", matchScore: 88 },
    { id: "3", name: "Taylor Hayes", headline: "Product Designer", matchScore: 85 },
];

const TRENDING_JOBS = [
    { id: "1", title: "Senior Frontend Engineer", company: "Stripe", location: "Remote", matchScore: 94 },
    { id: "2", title: "Product Manager", company: "Notion", location: "San Francisco", matchScore: 88 },
    { id: "3", title: "Staff Engineer", company: "Vercel", location: "Remote", matchScore: 91 },
];

// Mock user data (would come from auth context in production)
const CURRENT_USER = {
    name: "John Doe",
    headline: "Senior Software Engineer",
    username: "johndoe",
    trustScore: 78,
    profileCompletion: 85,
    stats: {
        applications: 12,
        interviews: 3,
        savedJobs: 8,
    },
};

export default function FeedPage() {
    const [feed, setFeed] = useState<FeedItem[]>(SAMPLE_FEED);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");

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

    const handlePost = async (content: string, type: PostType, visibility: PostVisibility) => {
        // Simulate API call
        await new Promise(r => setTimeout(r, 500));

        const newPost: FeedItem = {
            id: Date.now().toString(),
            type: type === "milestone" ? "milestone" : type === "job_share" ? "job_match" : "profile_update",
            user: {
                id: 1,
                name: CURRENT_USER.name,
                headline: CURRENT_USER.headline,
                username: CURRENT_USER.username,
            },
            content,
            likes: 0,
            comments: 0,
            created_at: new Date().toISOString(),
            isLiked: false,
        };

        setFeed(prev => [newPost, ...prev]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Quick Stats Bar */}
            <QuickStatsBar
                stats={[
                    { label: "Feed Posts", value: feed.length },
                    { label: "Connections", value: 247 },
                    { label: "Job Matches", value: 12 },
                ]}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <FadeIn>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Rss className="w-7 h-7 text-emerald-600" />
                                Your Feed
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                                Stay updated with your professional network
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Feed Tabs */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab("for-you")}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                        ${activeTab === "for-you"
                                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4 inline mr-1" />
                                    For You
                                </button>
                                <button
                                    onClick={() => setActiveTab("following")}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                        ${activeTab === "following"
                                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <Users className="w-4 h-4 inline mr-1" />
                                    Following
                                </button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="rounded-lg"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Three Column Layout */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Sidebar - Profile */}
                        <div className="hidden lg:block">
                            <FeedLeftSidebar user={CURRENT_USER} />
                        </div>

                        {/* Main Feed Column */}
                        <div className="flex-1 max-w-2xl mx-auto lg:mx-0 space-y-4">
                            {/* Create Post Composer */}
                            <CreatePostComposer
                                onPost={handlePost}
                                userName={CURRENT_USER.name}
                                placeholder="What's happening in your career?"
                            />

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
                            <div className="py-6 text-center">
                                <Button variant="outline" className="rounded-xl">
                                    Load More Posts
                                </Button>
                            </div>
                        </div>

                        {/* Right Sidebar - Agents & Suggestions */}
                        <div className="hidden xl:block">
                            <FeedRightSidebar
                                suggestedProfiles={SUGGESTED_PROFILES}
                                trendingJobs={TRENDING_JOBS}
                                showAgents={true}
                            />
                        </div>
                    </div>
                </FadeIn>
            </main>
        </div>
    );
}

