"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Link from "next/link";
import {
    Search,
    Users,
    TrendingUp,
    MapPin,
    Briefcase,
    Star,
    Shield,
    Trophy,
    Flame,
    Filter,
    ChevronRight,
    Verified,
    Eye,
    UserPlus,
    Bookmark,
    Loader2,
    AlertCircle,
    BookmarkCheck
} from "lucide-react";
import * as discoveryService from "@/services/discoveryService";
import * as socialService from "@/services/socialService";
import type { DiscoveryProfile } from "@/services/discoveryService";
import { toast } from "@/lib/toast";

interface ProfileCardProps {
    profile: DiscoveryProfile;
    onStarToggle?: (userId: number, isStarred: boolean) => void;
}

function ProfileCard({ profile, onStarToggle }: ProfileCardProps) {
    const [isStarred, setIsStarred] = useState(profile.is_starred);
    const [starLoading, setStarLoading] = useState(false);

    const handleStarClick = async () => {
        setStarLoading(true);
        try {
            if (isStarred) {
                await socialService.unstarProfile(profile.id);
                setIsStarred(false);
                toast.success("Removed from starred");
            } else {
                await socialService.starProfile(profile.id);
                setIsStarred(true);
                toast.success("Profile starred!");
            }
            onStarToggle?.(profile.id, !isStarred);
        } catch (error) {
            toast.error("Failed to update star status");
        } finally {
            setStarLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
                    ) : (
                        (profile.full_name || "?").charAt(0)
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {profile.full_name || "Anonymous"}
                        </h3>
                        {profile.is_verified && (
                            <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {profile.headline || (profile.industry ? `Professional in ${profile.industry}` : "Professional")}
                    </p>
                    {profile.industry && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Briefcase className="w-3 h-3" />
                            {profile.industry}
                        </div>
                    )}
                </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {profile.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            {skill}
                        </span>
                    ))}
                    {profile.skills.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-500 text-xs">+{profile.skills.length - 3}</span>
                    )}
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    {profile.average_rating !== null && (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">{profile.average_rating.toFixed(1)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <UserPlus className="w-3 h-3" />
                        {profile.followers_count} followers
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleStarClick}
                        disabled={starLoading}
                        className={`p-2 transition-colors ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`} 
                        title={isStarred ? "Unstar Profile" : "Star Profile"}
                    >
                        {starLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isStarred ? (
                            <BookmarkCheck className="w-4 h-4" />
                        ) : (
                            <Bookmark className="w-4 h-4" />
                        )}
                    </button>
                    <Link
                        href={`/p/${profile.username || profile.id}`}
                        className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                        View →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ExplorePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    
    // Data states
    const [trendingProfiles, setTrendingProfiles] = useState<DiscoveryProfile[]>([]);
    const [risingTalent, setRisingTalent] = useState<DiscoveryProfile[]>([]);
    const [topRated, setTopRated] = useState<DiscoveryProfile[]>([]);
    const [searchResults, setSearchResults] = useState<DiscoveryProfile[]>([]);
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/explore');
        }
    }, [user, authLoading, router]);

    // Fetch discovery data
    useEffect(() => {
        async function fetchDiscoveryData() {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Fetch all discovery data in parallel
                const [trendingRes, risingRes, topRatedRes] = await Promise.all([
                    discoveryService.getTrendingProfiles(1, 4),
                    discoveryService.getRisingTalent(1, 3),
                    discoveryService.getTopRatedProfiles(1, 2)
                ]);
                
                setTrendingProfiles(trendingRes.profiles);
                setRisingTalent(risingRes.profiles);
                setTopRated(topRatedRes.profiles);
            } catch (err) {
                console.error("Failed to fetch discovery data:", err);
                setError("Failed to load profiles. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        
        if (user) {
            fetchDiscoveryData();
        }
    }, [user]);

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        
        try {
            setSearchLoading(true);
            const results = await discoveryService.searchProfiles(searchQuery, 1, 10);
            setSearchResults(results.profiles);
        } catch (err) {
            console.error("Search failed:", err);
            toast.error("Search failed. Please try again.");
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery]);

    // Debounced search on input change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);
        
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const filters = [
        { id: "all", label: "All" },
        { id: "verified", label: "Verified Only" },
        { id: "top-rated", label: "Top Rated" },
        { id: "nearby", label: "Near Me" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <Search className="w-8 h-8 text-green-600" />
                        Explore Proofile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Discover and connect with verified professionals across industries
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by skills, role, company, or location..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {filters.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedFilter(filter.id)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                        selectedFilter === filter.id
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading profiles...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8 flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <span className="text-red-600 dark:text-red-400">{error}</span>
                    </div>
                )}

                {/* Search Results */}
                {searchQuery.trim() && searchResults.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Search className="w-5 h-5 text-green-500" />
                                Search Results for "{searchQuery}"
                            </h2>
                            <span className="text-sm text-gray-500">{searchResults.length} profiles found</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {searchResults.map((profile) => (
                                <ProfileCard key={profile.id} profile={profile} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Search Loading */}
                {searchLoading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
                    </div>
                )}

                {/* No Search Results */}
                {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center mb-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No profiles found</h3>
                        <p className="text-gray-600 dark:text-gray-400">Try adjusting your search terms</p>
                    </div>
                )}

                {/* Show sections only when not searching */}
                {!searchQuery.trim() && !loading && (
                    <>
                        {/* Trending Profiles */}
                        {trendingProfiles.length > 0 && (
                            <section className="mb-12">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Flame className="w-5 h-5 text-orange-500" />
                                        Trending Profiles
                                    </h2>
                                    <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {trendingProfiles.map((profile) => (
                                        <ProfileCard key={profile.id} profile={profile} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Rising Talent */}
                        {risingTalent.length > 0 && (
                            <section className="mb-12">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        Rising Talent
                                    </h2>
                                    <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                    New profiles gaining traction this week
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {risingTalent.map((profile) => (
                                        <ProfileCard key={profile.id} profile={profile} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Top Rated in Your Industry */}
                        {topRated.length > 0 && (
                            <section className="mb-12">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Top Rated Professionals
                                    </h2>
                                    <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {topRated.map((profile) => (
                                        <ProfileCard key={profile.id} profile={profile} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty State when no profiles exist */}
                        {trendingProfiles.length === 0 && risingTalent.length === 0 && topRated.length === 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center">
                                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No profiles yet</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Be one of the first to create your professional profile!</p>
                                <Link
                                    href="/profile"
                                    className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    Complete Your Profile
                                </Link>
                            </div>
                        )}
                    </>
                )}

                {/* CTA Section */}
                <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        🌟 Stand Out in the Crowd
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-4">
                        Complete your profile, get verified, and start collecting ratings to appear in trending searches.
                    </p>
                    <Link
                        href="/profile"
                        className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                        Complete Your Profile
                    </Link>
                </div>
            </main>
        </div>
    );
}
