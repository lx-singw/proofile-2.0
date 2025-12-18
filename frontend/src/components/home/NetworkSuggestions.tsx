"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, UserCheck, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { discoveryService, DiscoveryProfile } from "@/services/discoveryService";
import { followUser, unfollowUser } from "@/services/socialService";
import useAuth from "@/hooks/useAuth";
import { toast } from "@/lib/toast";

export function NetworkSuggestions() {
    const { user: currentUser } = useAuth();
    const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        async function fetchSuggestions() {
            try {
                setLoading(true);
                const response = await discoveryService.getTrendingProfiles(1, 4);
                // Filter out current user
                const suggestions = response.profiles.filter(p => p.id !== currentUser?.id);
                setProfiles(suggestions);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        }

        if (currentUser) {
            fetchSuggestions();
        }
    }, [currentUser]);

    const handleFollow = async (userId: number) => {
        try {
            const success = await followUser(userId);
            if (success) {
                setFollowingIds(prev => new Set(prev).add(userId));
                toast.success("Following");
            }
        } catch (error) {
            toast.error("Failed to follow");
        }
    };

    const handleUnfollow = async (userId: number) => {
        try {
            const success = await unfollowUser(userId);
            if (success) {
                setFollowingIds(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
                toast.success("Unfollowed");
            }
        } catch (error) {
            toast.error("Failed to unfollow");
        }
    };

    if (!currentUser) return null;
    if (loading) return (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 p-4 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
    );

    if (profiles.length === 0) return null;

    return (
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 p-4 overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="flex items-center justify-between mb-4 pt-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Who to follow</h3>
                </div>
                <Link href="/discovery" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 transition-colors">
                    View all
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="space-y-4">
                {profiles.map((profile) => {
                    const isFollowing = followingIds.has(profile.id) || profile.is_following;

                    return (
                        <div key={profile.id} className="flex items-center justify-between group">
                            <Link href={`/p/${profile.username || profile.id}`} className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-gray-800 shadow-sm">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            (profile.full_name || "A").charAt(0)
                                        )}
                                    </div>
                                    {profile.is_verified && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                                            <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <UserCheck className="w-2 h-2 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {profile.full_name || profile.username}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                        {profile.headline || "Professional Member"}
                                    </p>
                                </div>
                            </Link>

                            <button
                                onClick={() => isFollowing ? handleUnfollow(profile.id) : handleFollow(profile.id)}
                                className={`p-2 rounded-lg transition-all ${isFollowing
                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                    }`}
                                title={isFollowing ? "Unfollow" : "Follow"}
                            >
                                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
