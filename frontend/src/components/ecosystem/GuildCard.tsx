"use client";

import React from "react";
import {
    Users,
    Shield,
    Lock,
    ChevronRight,
    Zap,
    Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Guild } from "@/services/ecosystemService";
import useAuth from "@/hooks/useAuth";

interface GuildCardProps {
    guild: Guild;
    onJoin: (slug: string) => void;
    onView: (slug: string) => void;
    isJoining?: boolean;
}

export default function GuildCard({ guild, onJoin, onView, isJoining }: GuildCardProps) {
    const { user } = useAuth();
    const isLocked = (user?.trust_score || 0) < guild.min_trust_score;

    return (
        <div className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-500 ${isLocked
                ? "bg-gray-50/50 dark:bg-gray-900/40 border-gray-200/50 dark:border-gray-800/50"
                : "bg-white dark:bg-gray-800 border-emerald-500/10 hover:border-emerald-500/30 shadow-xl shadow-emerald-500/5 hover:shadow-emerald-500/10"
            }`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-colors ${isLocked ? "bg-gray-400" : "bg-emerald-500"
                }`} />

            <div className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isLocked
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 grayscale"
                                : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                            }`}>
                            {guild.icon_url ? (
                                <img src={guild.icon_url} alt={guild.name} className="w-8 h-8 object-contain" />
                            ) : (
                                guild.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                                {guild.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{guild.member_count} members</span>
                            </div>
                        </div>
                    </div>

                    {guild.is_member && (
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">
                            Member
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-6 min-h-[40px]">
                    {guild.description}
                </p>

                <div className="space-y-4">
                    {/* Entry Requirement */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${isLocked
                            ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500/20"
                            : "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20"
                        }`}>
                        <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${isLocked ? "text-amber-500" : "text-emerald-500"}`} />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight">Trust Required</span>
                        </div>
                        <span className={`text-sm font-black ${isLocked ? "text-amber-600" : "text-emerald-600"}`}>
                            {guild.min_trust_score}+
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {isLocked ? (
                            <Button
                                disabled
                                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 cursor-not-allowed group-hover:hidden"
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Restricted
                            </Button>
                        ) : (
                            guild.is_member ? (
                                <Button
                                    onClick={() => onView(guild.slug)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    Enter Guild
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => onJoin(guild.slug)}
                                    disabled={isJoining}
                                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:scale-[1.02] transition-all"
                                >
                                    {isJoining ? "Joining..." : "Request Access"}
                                </Button>
                            )
                        )}

                        {isLocked && (
                            <Button
                                variant="outline"
                                className="flex-1 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hidden group-hover:flex animate-in fade-in slide-in-from-bottom-2"
                            >
                                <Zap className="w-4 h-4 mr-2 fill-amber-500" />
                                Boost Trust
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Elite Badge Overlay (for high trust guilds) */}
            {guild.min_trust_score >= 80 && (
                <div className="absolute -top-6 -right-6 p-8 bg-amber-400/10 rounded-full group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 text-amber-500 opacity-30" />
                </div>
            )}
        </div>
    );
}
