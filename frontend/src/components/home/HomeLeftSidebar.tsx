"use client";

import React from "react";
import Link from "next/link";
import {
    TrendingUp,
    CheckCircle,
    Star,
    Award,
    RefreshCw,
    Wrench,
    Users
} from "lucide-react";
import { feedService, PostResponse } from "@/services/feedService";
import { formatDistanceToNow } from "date-fns";

export default function HomeLeftSidebar() {
    const [activities, setActivities] = React.useState<PostResponse[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchActivities() {
            try {
                setLoading(true);
                const response = await feedService.getFeed({ size: 6, types: "milestone,skill_verified,achievement" });
                setActivities(response.posts);
            } catch (error) {
                // Gracefully handle auth errors for guest users
                if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
                    // Guest user - no activities to show
                    setActivities([]);
                } else {
                    console.error("Failed to fetch live activity:", error);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchActivities();
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "milestone": return <Award className="w-5 h-5 text-emerald-500" />;
            case "skill_verified": return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "achievement": return <Star className="w-5 h-5 text-amber-500" />;
            default: return <TrendingUp className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <aside className="w-full lg:w-72 space-y-4">
            {/* Live Platform Activity */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-green-800/30 overflow-hidden shadow-lg shadow-green-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Live Activity</h3>
                    </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : activities.length > 0 ? (
                        activities.map((item) => (
                            <div key={item.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                                <span className="flex-shrink-0">{getActivityIcon(item.type)}</span>
                                <div className="text-xs text-gray-700 dark:text-gray-300 flex-1 min-w-0">
                                    <span className="font-bold uppercase text-[10px] block opacity-60 mb-0.5">{item.type.replace('_', ' ')}</span>
                                    <span className="font-bold">{item.user.full_name || item.user.username}</span>
                                    <span className="truncate block opacity-80">{item.content.substring(0, 40)}{item.content.length > 40 ? "..." : ""}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 flex-shrink-0">
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: false }).replace('about ', '')}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-xs text-gray-500">
                            No recent platform activity
                        </div>
                    )}
                </div>
                <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Join <span className="font-bold text-green-600 dark:text-green-400">10,000+</span> professionals
                    </p>
                </div>
            </div>

            {/* For Talent Card */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4 overflow-hidden shadow-lg shadow-blue-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="flex items-center gap-3 mb-4 pt-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">For Professionals</h3>
                </div>
                <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300 text-xs">Build verified professional identity</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300 text-xs">Unlock AI-powered job matches</span>
                    </li>
                </ul>
                <Link
                    href="/opportunities"
                    className="block w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center text-xs"
                >
                    Find Opportunities
                </Link>
            </div>
        </aside>
    );
}
