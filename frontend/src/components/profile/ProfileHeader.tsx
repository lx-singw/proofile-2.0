"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Share2,
    Download,
    QrCode,
    UserPlus,
    Edit3,
    CheckCircle,
    MapPin,
    Briefcase
} from "lucide-react";
import { EditableField } from "@/components/profile/EditableField";

interface ProfileHeaderProps {
    user: any;
    profile: any;
    isOwner: boolean;
    isFollowing: boolean;
    onFollow: () => void;
    onShare: () => void;
    onDownloadResume: () => void;
    onShowQR: () => void;
    onUpdate: (data: Partial<any>) => Promise<void> | void;
}

export function ProfileHeader({
    user,
    profile,
    isOwner,
    isFollowing,
    onFollow,
    onShare,
    onDownloadResume,
    onShowQR,
    onUpdate
}: ProfileHeaderProps) {

    const trustScore = profile.completeness_data?.trust || 0;
    const isVerified = trustScore > 10;

    return (
        <div className="relative mb-8 group">
            {/* Cover Image */}
            <div className="h-48 sm:h-64 rounded-b-[2.5rem] overflow-hidden relative shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
                        <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20 sm:-mt-24">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8">

                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl p-1 bg-white dark:bg-gray-800 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={user.full_name}
                                        width={160}
                                        height={160}
                                        className="rounded-xl object-cover w-full h-full"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-4xl font-bold text-gray-400">
                                        {user.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-lg" title={`Trust Score: ${trustScore}`}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-gray-800">
                                    {trustScore}
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="w-full">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                        {user.full_name}
                                        {isVerified && (
                                            <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-50 dark:fill-blue-900/20" />
                                        )}
                                    </h1>

                                    <div className="mb-4 max-w-2xl">
                                        <EditableField
                                            value={profile.headline || ""}
                                            onSave={(val) => onUpdate({ headline: val })}
                                            isOwner={isOwner}
                                            placeholder="Add a professional headline (e.g. Senior Software Engineer)"
                                            className="text-lg text-blue-600 dark:text-blue-400 font-medium"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            San Francisco, CA
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                            Open to opportunities
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                    {isOwner ? (
                                        // Edit Profile Button acts as a fallback/more options
                                        <Button asChild className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold rounded-xl shadow-lg transition-all hidden sm:flex">
                                            <Link href="/profile/edit">
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                More Actions
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={onFollow}
                                            className={`font-semibold rounded-xl transition-all ${isFollowing
                                                    ? "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                                                }`}
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            {isFollowing ? "Following" : "Follow"}
                                        </Button>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={onShare} className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={onDownloadResume} className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
