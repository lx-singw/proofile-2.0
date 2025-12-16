"use client";

import React from "react";
import Link from "next/link";
import {
    User,
    Briefcase,
    FileText,
    Shield,
    Settings,
    TrendingUp,
    ChevronRight,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfileData {
    name: string;
    headline?: string;
    avatarUrl?: string;
    username?: string;
    trustScore?: number;
    profileCompletion?: number;
    stats?: {
        applications?: number;
        interviews?: number;
        savedJobs?: number;
    };
}

interface FeedLeftSidebarProps {
    user?: UserProfileData;
}

export function FeedLeftSidebar({ user }: FeedLeftSidebarProps) {
    const defaultUser: UserProfileData = {
        name: "User",
        headline: "Professional",
        trustScore: 0,
        profileCompletion: 30,
        stats: {
            applications: 0,
            interviews: 0,
            savedJobs: 0,
        },
    };

    const userData = user || defaultUser;
    const trustLevel = userData.trustScore && userData.trustScore >= 80 ? "Gold" :
        userData.trustScore && userData.trustScore >= 50 ? "Silver" : "Bronze";

    return (
        <aside className="w-full lg:w-64 space-y-4">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Banner */}
                <div className="h-16 bg-gradient-to-r from-emerald-500 via-emerald-500 to-pink-500" />

                {/* Profile Info */}
                <div className="px-4 pb-4 -mt-8">
                    <Link href={`/p/${userData.username || "me"}`} className="block">
                        {userData.avatarUrl ? (
                            <img
                                src={userData.avatarUrl}
                                alt={userData.name}
                                className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                                {userData.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>

                    <Link href={`/p/${userData.username || "me"}`} className="block mt-2">
                        <h3 className="font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            {userData.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {userData.headline}
                    </p>

                    {/* Trust Score */}
                    {userData.trustScore !== undefined && (
                        <div className="mt-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {userData.trustScore}%
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                ${trustLevel === "Gold" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    trustLevel === "Silver" ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" :
                                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                }`}>
                                {trustLevel}
                            </span>
                        </div>
                    )}
                </div>

                {/* Profile Completion */}
                {userData.profileCompletion !== undefined && userData.profileCompletion < 100 && (
                    <div className="px-4 pb-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Profile Completion
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {userData.profileCompletion}%
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${userData.profileCompletion}%` }}
                                />
                            </div>
                            <Link
                                href="/profile/edit"
                                className="flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                Complete your profile
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Application Stats */}
            {userData.stats && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                        Your Applications
                    </h4>
                    <div className="space-y-2">
                        <Link
                            href="/applications"
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {userData.stats.applications || 0}
                            </span>
                        </Link>
                        <Link
                            href="/applications?status=interview"
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="text-sm text-gray-600 dark:text-gray-400">Interviews</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {userData.stats.interviews || 0}
                            </span>
                        </Link>
                        <Link
                            href="/saved-jobs"
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="text-sm text-gray-600 dark:text-gray-400">Saved Jobs</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {userData.stats.savedJobs || 0}
                            </span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                    Quick Actions
                </h4>
                <div className="space-y-1">
                    <Link
                        href="/resume"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <FileText className="w-4 h-4" />
                        Update Resume
                    </Link>
                    <Link
                        href="/verification"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Get Verified
                    </Link>
                    <Link
                        href="/jobs"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <Briefcase className="w-4 h-4" />
                        Browse Jobs
                    </Link>
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </Link>
                </div>
            </div>
        </aside>
    );
}
