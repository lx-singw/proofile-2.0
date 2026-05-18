"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    User,
    Shield,
    Eye,
    Star,
    Users,
    ArrowRight,
    TrendingUp,
    FileText,
    Settings,
    CheckCircle,
    Zap,
    RefreshCw,
    Award
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { useProfile, useProfileActions } from "@/hooks/useProfile";
import { institutionalService } from "@/services/institutionalService";
import { toast } from "@/lib/toast";

interface ProfileStats {
    trustScore: number;
    profileViews: number;
    followers: number;
    verifiedSkills: number;
    isGold: boolean;
}

export function UserProfileCard() {
    const { user } = useAuth();
    const { data: profile } = useProfile();
    const [stats, setStats] = useState<ProfileStats>({
        trustScore: 0,
        profileViews: 0,
        followers: 0,
        verifiedSkills: 0,
        isGold: false
    });
    const [isSyncing, setIsSyncing] = useState(false);
    const { invalidateProfile } = useProfileActions();

    useEffect(() => {
        const profileData = profile as any;
        if (profileData) {
            setStats({
                trustScore: (user as any)?.trust_score || 45,
                profileViews: 127,
                followers: 24,
                verifiedSkills: profileData.skills_data?.length || 0,
                isGold: profileData.verifications?.some((v: any) => v.is_gold_standard) || false
            });
        }
    }, [profile, user]);

    const handleHrisSync = async () => {
        try {
            setIsSyncing(true);
            await institutionalService.syncHrisData();
            toast.success("Identity synced with Workday!");
            await invalidateProfile();
        } catch (error) {
            toast.error("Failed to sync with institution");
        } finally {
            setIsSyncing(false);
        }
    };

    if (!user) return null;

    const completeness = profile?.completeness_score || 30;

    return (
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden shadow-xl shadow-emerald-500/10">
            {/* Gradient header */}
            <div className="h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            {/* Avatar */}
            <div className="relative px-4 -mt-10">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-emerald-500/30 border-4 border-white dark:border-gray-800">
                    {user.profile_photo_url ? (
                        <img
                            src={user.profile_photo_url as string}
                            alt={user.full_name || "Profile"}
                            className="w-full h-full rounded-lg object-cover"
                        />
                    ) : (
                        (user.full_name || user.username || "?").charAt(0)
                    )}

                    {/*                     {stats.isGold && (
                        <div className="absolute -bottom-2 -right-2 bg-amber-400 p-1.5 rounded-full shadow-lg border-2 border-white dark:border-gray-800 animate-pulse">
                            <Award className="w-4 h-4 text-white fill-white" />
                        </div>
                    )} */}
                </div>
            </div>

            {/* User Info */}
            <div className="px-4 pt-2 pb-4">
                <Link href={`/p/${user.username || ""}`} className="group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {user.full_name || user.username || "User"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username || ""}</p>
                </Link>

                {profile?.headline && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {String(profile.headline)}
                    </p>
                )}

                {/* Profile Completeness */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Profile Strength</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completeness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${completeness}%` }}
                        />
                    </div>
                    {completeness < 80 && (
                        <Link
                            href="/profile?edit=true"
                            className="flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                        >
                            Complete your profile
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Shield className="w-4 h-4" />
                            <span className="font-bold text-lg">{stats.trustScore}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Trust Score</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                            <Eye className="w-4 h-4" />
                            <span className="font-bold text-lg">{stats.profileViews}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Profile Views</p>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                            <Users className="w-4 h-4" />
                            <span className="font-bold text-lg">{stats.followers}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Followers</p>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-bold text-lg">{stats.verifiedSkills}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Skills</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 mt-4">
                    <div className="flex gap-2">
                        <Link
                            href={`/p/${user.username}`}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all"
                        >
                            <User className="w-3 h-3" />
                            View Profile
                        </Link>
                    </div>

                    {/*                     {!stats.isGold && (
                        <button
                            onClick={handleHrisSync}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg hover:scale-[1.02] transition-all shadow-lg shadow-gray-500/10"
                        >
                            {isSyncing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            )}
                            Sync Institutional Identity
                        </button>
                    )} */}
                </div>
            </div>
        </div>
    );
}
