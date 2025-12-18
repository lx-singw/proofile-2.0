"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Star, Loader2 } from "lucide-react";
import { discoveryService, DiscoveryProfile } from "@/services/discoveryService";

export default function TopTalentWidget() {
    const [topSkills, setTopSkills] = React.useState<DiscoveryProfile[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const skillsRes = await discoveryService.getTopRatedProfiles(1, 4);
                setTopSkills(skillsRes.profiles);
            } catch (error) {
                console.error("Failed to fetch top talent:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 overflow-hidden shadow-lg shadow-amber-500/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
            <div className="flex items-center justify-between mb-4 pt-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                        <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Top Talent</h3>
                </div>
            </div>
            <div className="space-y-3">
                {loading ? (
                    <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>
                ) : topSkills.map((profile, index) => (
                    <div
                        key={profile.id}
                        className={`bg-white dark:bg-gray-900 rounded-xl p-3 border transition-all hover:scale-[1.02] ${index === 0 ? "border-amber-200 dark:border-amber-700" : "border-gray-200 dark:border-gray-700"}`}
                    >
                        <Link href={`/p/${profile.username || profile.id}`} className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-bold ${index === 0 ? "text-amber-600" : "text-gray-500"}`}>#{index + 1}</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{profile.full_name || profile.username}</span>
                        </Link>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{profile.headline || "Professional"}</p>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{profile.average_rating || "5.0"}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
