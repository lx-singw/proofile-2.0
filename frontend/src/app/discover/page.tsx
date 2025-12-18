"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import { AdvancedSearch } from "@/components/discover/AdvancedSearch";
import { ProfileCard, ProfileCardData } from "@/components/discover/ProfileCard";
import { Users, TrendingUp, Shield, Star, Sparkles, Flame, Compass } from "lucide-react";
import { toast } from "@/lib/toast";
import { discoveryService } from "@/services/discoveryService";
import QuickStatsBar from "@/components/ui/QuickStatsBar";
import { FadeIn } from "@/components/ui/PageTransition";
import Link from "next/link";

// Sample data (would come from API in production)
const SAMPLE_PROFILES: ProfileCardData[] = [
    {
        id: 1,
        username: "sarachen",
        name: "Sarah Chen",
        headline: "Senior Software Engineer at Meta",
        location: "San Francisco, CA",
        rating: 4.9,
        rating_count: 23,
        is_verified: true,
        skills: ["React", "TypeScript", "Node.js", "System Design"],
        match_score: 95,
    },
    {
        id: 2,
        username: "marcusj",
        name: "Marcus Johnson",
        headline: "Product Manager | Ex-Google",
        location: "New York, NY",
        rating: 4.8,
        rating_count: 18,
        is_verified: true,
        skills: ["Product Strategy", "Agile", "Data Analysis"],
        match_score: 88,
    },
    {
        id: 3,
        username: "emilyw",
        name: "Emily Watson",
        headline: "UX Design Lead at Airbnb",
        location: "Remote",
        rating: 5.0,
        rating_count: 31,
        is_verified: true,
        skills: ["Figma", "Design Systems", "User Research"],
        match_score: 82,
    },
    {
        id: 4,
        username: "alexr",
        name: "Alex Rivera",
        headline: "Full Stack Developer",
        location: "Austin, TX",
        rating: 4.7,
        rating_count: 12,
        is_verified: false,
        skills: ["Python", "React", "AWS"],
        match_score: 79,
    },
];

const TRENDING_CATEGORIES = [
    { label: "Top Product Managers", icon: TrendingUp, count: 234, industry: "Product Management" },
    { label: "Rising Engineers", icon: Users, count: 567, industry: "Engineering" },
    { label: "Verified Leaders", icon: Shield, count: 123, industry: "Management" },
    { label: "Top Rated in Tech", icon: Star, count: 89, industry: "Technology" },
];

export default function DiscoverPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchTrending = async (industry?: string) => {
        try {
            setInitialLoading(true);
            const response = await discoveryService.getTrendingProfiles(1, 10, industry);
            setProfiles(response.profiles);
        } catch (error) {
            console.error("Failed to fetch trending profiles:", error);
            toast.error("Failed to load discovery profiles");
        } finally {
            setInitialLoading(false);
        }
    };

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login?redirect=/discover');
            } else {
                fetchTrending();
            }
        }
    }, [user, loading, router]);

    if (loading || initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const handleSearch = async (filters: any) => {
        setIsSearching(true);
        try {
            const response = await discoveryService.searchProfiles(filters.query || "", 1, 20, {
                industry: filters.industry,
                experience_level: filters.experienceLevel
            });
            setProfiles(response.profiles);
            toast.success(`Found ${response.total} matching profiles`);
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Search failed. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleConnect = (id: number) => {
        toast.success("Connection request sent!");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Quick Stats Bar */}
            <QuickStatsBar
                stats={[
                    { label: "Profiles", value: profiles.length },
                    { label: "Categories", value: TRENDING_CATEGORIES.length },
                ]}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FadeIn>
                    {/* Header - Jobs Style */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-8 h-8 text-emerald-500" />
                                Discover Professionals
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Find and connect with verified professionals in your industry
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/explore"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Compass className="w-4 h-4" />
                                Explore
                            </Link>
                            <Link
                                href="/feed"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Feed
                            </Link>
                        </div>
                    </div>

                    {/* Advanced Search */}
                    <div className="mb-8">
                        <AdvancedSearch onSearch={handleSearch} isLoading={isSearching} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Main Results */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-emerald-500" />
                                    Recommended For You
                                </h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {profiles.length} profiles
                                </span>
                            </div>

                            {isSearching ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 p-5 animate-pulse">
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {profiles.map(profile => (
                                        <ProfileCard
                                            key={profile.id}
                                            profile={{
                                                id: profile.id,
                                                username: profile.username,
                                                name: profile.full_name || "Anonymous",
                                                headline: profile.headline,
                                                avatar_url: profile.avatar_url,
                                                location: profile.industry, // Mapping industry to location for now as location isn't in DiscoveryProfile
                                                rating: profile.average_rating,
                                                rating_count: undefined,
                                                is_verified: profile.is_verified,
                                                skills: profile.skills,
                                                match_score: profile.match_score
                                            }}
                                            onConnect={handleConnect}
                                            showMatchScore
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-6">
                            {/* Trending Categories */}
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 border border-gray-100 dark:border-gray-700 p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Trending
                                </h3>
                                <div className="space-y-3">
                                    {TRENDING_CATEGORIES.map((cat, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => fetchTrending(cat.industry)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-[1.02] text-left"
                                        >
                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                <cat.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</p>
                                                <p className="text-xs text-gray-500">{cat.count} profiles</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">💡 Pro Tip</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Verified profiles get 3x more visibility in search results. Complete your verification today!
                                </p>
                            </div>
                        </aside>
                    </div>
                </FadeIn>
            </main>
        </div>
    );
}
