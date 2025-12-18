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

import { feedService, PostResponse } from "@/services/feedService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";

export default function FeedPage() {
    const { user: currentUser, loading } = useAuth();
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
    const [initialLoading, setInitialLoading] = useState(true);

    const mapPostToFeedItem = (post: PostResponse): FeedItem => ({
        id: post.id.toString(),
        type: post.type as any, // Fallback to compatible types
        user: {
            id: post.user.id,
            name: post.user.full_name || "Anonymous",
            headline: post.user.headline || "",
            username: post.user.username,
        },
        content: post.content,
        likes: post.likes_count,
        comments: post.comments_count,
        created_at: post.created_at,
        isLiked: post.user_reaction === "like",
    });

    const fetchFeed = async () => {
        try {
            setIsRefreshing(true);
            const response = await feedService.getFeed({
                following_only: activeTab === "following",
                size: 20
            });
            setFeed(response.posts.map(mapPostToFeedItem));
        } catch (error) {
            console.error("Failed to fetch feed:", error);
            toast.error("Failed to load feed");
        } finally {
            setIsRefreshing(false);
            setInitialLoading(false);
        }
    };

    React.useEffect(() => {
        if (!loading && currentUser) {
            fetchFeed();
        }
    }, [currentUser, loading, activeTab]);

    if (loading || initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const handleLike = async (id: string) => {
        try {
            const postId = parseInt(id);
            await feedService.toggleReaction(postId, "like");

            setFeed(prev => prev.map(item => {
                if (item.id === id) {
                    const newIsLiked = !item.isLiked;
                    return {
                        ...item,
                        isLiked: newIsLiked,
                        likes: newIsLiked ? item.likes + 1 : item.likes - 1
                    };
                }
                return item;
            }));
        } catch (error) {
            toast.error("Failed to update reaction");
        }
    };

    const handleRefresh = () => {
        fetchFeed();
    };

    const handlePost = async (content: string, type: PostType, visibility: PostVisibility) => {
        try {
            const postTypeMap: Record<string, any> = {
                "text": "text",
                "milestone": "milestone",
                "job_share": "job_share",
                "poll": "poll"
            };

            const response = await feedService.createPost({
                content,
                type: postTypeMap[type] || "text",
                visibility: visibility as any
            });

            const newItem = mapPostToFeedItem(response);
            setFeed(prev => [newItem, ...prev]);
            toast.success("Post created successfully!");
        } catch (error) {
            toast.error("Failed to create post");
        }
    };

    return (
        // 1. GRADIENT BACKGROUND
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/30">
            {/* Quick Stats Bar */}
            <QuickStatsBar
                stats={[
                    { label: "Feed Posts", value: feed.length },
                    { label: "Connections", value: 247 },
                    { label: "Job Matches", value: 12 },
                ]}
            />

            {/* 7. IMPROVED SPACING */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <FadeIn>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Rss className="w-7 h-7 text-emerald-600 drop-shadow-lg" />
                                Your Feed
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                Stay updated with your professional network
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* 2. GLASS MORPHISM + 4. HOVER ANIMATIONS on tabs */}
                            <div className="flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-1.5 shadow-lg shadow-emerald-500/5 border border-white/20 dark:border-gray-700/50">
                                <button
                                    onClick={() => setActiveTab("for-you")}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${activeTab === "for-you"
                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4 inline mr-1.5" />
                                    For You
                                </button>
                                <button
                                    onClick={() => setActiveTab("following")}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${activeTab === "following"
                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
                                        }`}
                                >
                                    <Users className="w-4 h-4 inline mr-1.5" />
                                    Following
                                </button>
                            </div>

                            {/* 6. BUTTON GLOW EFFECT */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-[1.05] hover:shadow-lg transition-all duration-200"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Three Column Layout */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Sidebar - Profile */}
                        <div className="hidden lg:block">
                            <FeedLeftSidebar user={{
                                name: currentUser?.full_name || "User",
                                headline: (currentUser as any)?.headline || currentUser?.industry || "Professional",
                                username: currentUser?.username || "user",
                                trustScore: (currentUser as any)?.trust_score || 0,
                                profileCompletion: 85,
                                stats: {
                                    applications: 0,
                                    interviews: 0,
                                    savedJobs: 0,
                                }
                            }} />
                        </div>

                        {/* Main Feed Column */}
                        <div className="flex-1 max-w-2xl mx-auto lg:mx-0 space-y-5">
                            {/* 2. GLASS MORPHISM + 5. BORDER ACCENT on composer */}
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border-l-4 border-emerald-500 shadow-xl shadow-emerald-500/5 overflow-hidden">
                                <CreatePostComposer
                                    onPost={handlePost}
                                    userName={currentUser?.full_name || "User"}
                                    placeholder="What's happening in your career?"
                                />
                            </div>

                            {/* Feed Items with 4. HOVER ANIMATIONS */}
                            <div className="space-y-5">
                                {feed.map(item => (
                                    <div
                                        key={item.id}
                                        className="transform hover:scale-[1.01] hover:-translate-y-1 transition-all duration-200"
                                    >
                                        <FeedCard
                                            item={item}
                                            onLike={handleLike}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Load More - 6. BUTTON GLOW */}
                            <div className="py-8 text-center">
                                <Button
                                    variant="outline"
                                    className="rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                                >
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
