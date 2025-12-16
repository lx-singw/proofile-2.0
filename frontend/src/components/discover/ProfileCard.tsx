"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, CheckCircle, MapPin, Briefcase, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProfileCardData {
    id: number;
    username?: string;
    name: string;
    headline?: string;
    avatar_url?: string;
    location?: string;
    rating?: number;
    rating_count?: number;
    is_verified?: boolean;
    skills?: string[];
    match_score?: number;
}

interface ProfileCardProps {
    profile: ProfileCardData;
    onConnect?: (id: number) => void;
    showMatchScore?: boolean;
}

export function ProfileCard({ profile, onConnect, showMatchScore }: ProfileCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all hover:border-emerald-200 dark:hover:border-emerald-800 group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <Link href={`/p/${profile.username || profile.id}`} className="flex-shrink-0">
                    {profile.avatar_url ? (
                        <Image
                            src={profile.avatar_url}
                            alt={profile.name}
                            width={56}
                            height={56}
                            className="rounded-xl object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                            {profile.name.charAt(0)}
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={`/p/${profile.username || profile.id}`}
                            className="font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                        >
                            {profile.name}
                        </Link>
                        {profile.is_verified && (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                        {showMatchScore && profile.match_score && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                {profile.match_score}% match
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                        {profile.headline || "Proofile User"}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {profile.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {profile.location}
                            </span>
                        )}
                        {profile.rating && (
                            <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                                {profile.rating.toFixed(1)}
                                {profile.rating_count && <span className="text-gray-400">({profile.rating_count})</span>}
                            </span>
                        )}
                    </div>

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {profile.skills.slice(0, 3).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                                >
                                    {skill}
                                </span>
                            ))}
                            {profile.skills.length > 3 && (
                                <span className="text-xs text-gray-400">+{profile.skills.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Action */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConnect?.(profile.id)}
                    className="rounded-lg border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 flex-shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
