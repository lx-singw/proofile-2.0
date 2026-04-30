"use client";

import React from "react";
import Link from "next/link";
import {
    Bot,
    Target,
    FileText,
    Users,
    Briefcase,
    TrendingUp,
    Sparkles,
    ChevronRight,
    Zap,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestedProfile {
    id: string | number;
    name: string;
    headline?: string;
    avatarUrl?: string;
    matchScore?: number;
}

interface AgentStatus {
    name: string;
    icon: React.ReactNode;
    status: string;
    action?: string;
    actionLink?: string;
    color: string;
}

interface TrendingJob {
    id: string;
    title: string;
    company: string;
    location?: string;
    matchScore?: number;
}

interface FeedRightSidebarProps {
    suggestedProfiles?: SuggestedProfile[];
    trendingJobs?: TrendingJob[];
    showAgents?: boolean;
}

const DEFAULT_AGENTS: AgentStatus[] = [
    {
        name: "Hunter Agent",
        icon: <Target className="w-4 h-4" />,
        status: "Scanning for matches...",
        action: "View Jobs",
        actionLink: "/jobs",
        color: "text-emerald-500",
    },
    {
        name: "Tailor Agent",
        icon: <FileText className="w-4 h-4" />,
        status: "Resume ready",
        action: "Preview",
        actionLink: "/resume",
        color: "text-emerald-500",
    },
];

export function FeedRightSidebar({
    suggestedProfiles = [],
    trendingJobs = [],
    showAgents = true,
}: FeedRightSidebarProps) {
    return (
        <aside className="w-full lg:w-80 space-y-4">
            {/* Agent HQ */}
            {showAgents && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-emerald-500" />
                        Agent HQ
                        <span className="ml-auto text-xs font-normal px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            Active
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {DEFAULT_AGENTS.map(agent => (
                            <div
                                key={agent.name}
                                className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={agent.color}>{agent.icon}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {agent.name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {agent.status}
                                </p>
                                {agent.action && agent.actionLink && (
                                    <Link
                                        href={agent.actionLink}
                                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                        {agent.action}
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Connections */}
            {suggestedProfiles.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-500" />
                        People You May Know
                    </h3>
                    <div className="space-y-3">
                        {suggestedProfiles.slice(0, 5).map(profile => (
                            <div key={profile.id} className="flex items-center gap-3">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                        {profile.name?.charAt(0) ?? '?'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                        {profile.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {profile.headline}
                                    </p>
                                </div>
                                {profile.matchScore && (
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                        {profile.matchScore}%
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full mt-4 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl text-sm"
                    >
                        View All
                    </Button>
                </div>
            )}

            {/* Jobs For You */}
            {trendingJobs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-green-500" />
                        Jobs For You
                    </h3>
                    <div className="space-y-2">
                        {trendingJobs.slice(0, 4).map(job => (
                            <Link
                                key={job.id}
                                href={`/jobs/${job.id}`}
                                className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                            {job.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {job.company} {job.location && `• ${job.location}`}
                                        </p>
                                    </div>
                                    {job.matchScore && (
                                        <span className="flex-shrink-0 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                            {job.matchScore}%
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        asChild
                        className="w-full mt-4 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl text-sm"
                    >
                        <Link href="/jobs">Browse All Jobs</Link>
                    </Button>
                </div>
            )}

            {/* Trending Topics */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Trending Now
                </h3>
                <div className="flex flex-wrap gap-2">
                    {["#AI", "#RemoteWork", "#TechCareers", "#ProductManagement", "#Startups"].map(tag => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-colors"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Profile Views Insight */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">234</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Profile views this week</p>
                    </div>
                    <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">
                        +15%
                    </span>
                </div>
            </div>
        </aside>
    );
}
