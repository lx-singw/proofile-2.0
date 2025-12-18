"use client";

import React, { useState, useEffect } from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { FadeIn } from "@/components/ui/PageTransition";
import GuildCard from "@/components/ecosystem/GuildCard";
import { ecosystemService, Guild } from "@/services/ecosystemService";
import { toast } from "@/lib/toast";
import {
    Compass,
    ShieldCheck,
    Star,
    Filter,
    Search,
    RefreshCw,
    Sparkles
} from "lucide-react";

export default function GuildsPage() {
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState<string | null>(null);

    const fetchGuilds = async () => {
        try {
            setIsLoading(true);
            const data = await ecosystemService.getGuilds();
            setGuilds(data);
        } catch (error) {
            toast.error("Failed to load professional guilds");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGuilds();
    }, []);

    const handleJoin = async (slug: string) => {
        try {
            setIsJoining(slug);
            await ecosystemService.joinGuild(slug);
            toast.success("Welcome to the guild!");
            fetchGuilds(); // Refresh status
        } catch (error: any) {
            toast.error(error.message || "Failed to join guild");
        } finally {
            setIsJoining(null);
        }
    };

    const handleView = (slug: string) => {
        // Redirection logic to specific guild content
        toast.info(`Entering ${slug} exclusive lounge...`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <HomeHeader />

            <main className="max-w-6xl mx-auto px-4 py-12">
                <FadeIn>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-full uppercase tracking-widest mb-2">
                                <Sparkles className="w-3 h-3" />
                                Exclusive Ecosystem
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Professional Guilds</h1>
                            <p className="text-gray-600 dark:text-gray-400 max-w-xl">
                                Join elite professional communities gated by verified reputation and skills. Access high-signal networking and verified opportunities.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search guilds..."
                                    className="h-11 pl-10 pr-4 bg-white dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm w-full md:w-64 transition-all"
                                />
                            </div>
                            <button className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <Filter className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                            <p className="text-sm font-bold text-gray-400 animate-pulse">Scanning trust networks...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {guilds.map((guild) => (
                                <GuildCard
                                    key={guild.id}
                                    guild={guild}
                                    onJoin={handleJoin}
                                    onView={handleView}
                                    isJoining={isJoining === guild.slug}
                                />
                            ))}
                        </div>
                    )}

                    {/* Trust Tiers Explainer */}
                    <div className="mt-20 p-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-black tracking-tight">How Guilds Work</h2>
                                <p className="text-gray-400 leading-relaxed">
                                    Unlike traditional groups, Proofile Guilds are algorithmically enforced. Your entry depends on your **Trust Score**—a live reputation index powered by your verified experience, peer endorsements, and institutional claims.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Verified Reputation</p>
                                            <p className="text-gray-500 text-xs">Access communities only with people who are who they say they are.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                            <Star className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Zero Noise</p>
                                            <p className="text-gray-500 text-xs">High-signal discussions gated by professional seniority.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Your Current Rep</span>
                                    <span className="text-2xl font-black">95</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[95%]" />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                        <span>STARTER</span>
                                        <span className="text-emerald-400">PLATINUM TIER</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-xs text-gray-400 italic font-medium leading-relaxed">
                                        "You're in the top 5% of verified professionals. You have unlocked access to all current guilds."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </main>
        </div>
    );
}
