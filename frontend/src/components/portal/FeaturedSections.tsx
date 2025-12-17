"use client";

import React, { useEffect, useState } from "react";
import { Clock, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import PortalJobCard from "@/components/portal/PortalJobCard";
import portalService from "@/services/portalService";

interface PortalJob {
    id: number;
    slug?: string;
    title: string;
    company: string;
    company_logo_url?: string;
    location?: string;
    location_type?: string;
    salary_display?: string;
    skills?: string[];
    experience_level?: string;
    category?: string;
    job_type?: string;
    opportunity_category?: string;
    opportunity_type?: string;
    is_remote: boolean;
    posted_at?: string;
    source: string;
    views_count?: number;
    applies_count?: number;
}

interface FeaturedSectionsProps {
    className?: string;
}

export default function FeaturedSections({ className = "" }: FeaturedSectionsProps) {
    const [recentJobs, setRecentJobs] = useState<PortalJob[]>([]);
    const [trendingJobs, setTrendingJobs] = useState<PortalJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedJobs = async () => {
            try {
                setIsLoading(true);

                // Fetch recently posted (sorted by posted_at desc)
                const recentResponse = await portalService.searchJobs({
                    sort_by: "posted_at",
                    sort_order: "desc",
                    size: 4
                });

                // For trending, we'd ideally sort by views/applies
                // Using same endpoint but different jobs for now
                const trendingResponse = await portalService.searchJobs({
                    sort_by: "views_count",
                    sort_order: "desc",
                    size: 4
                });

                if (recentResponse?.jobs) {
                    setRecentJobs(recentResponse.jobs.map((j: any) => ({
                        ...j,
                        is_remote: j.location_type === "remote" || j.is_remote
                    })));
                }

                if (trendingResponse?.jobs) {
                    setTrendingJobs(trendingResponse.jobs.map((j: any) => ({
                        ...j,
                        is_remote: j.location_type === "remote" || j.is_remote
                    })));
                }
            } catch (error) {
                console.error("Error fetching featured jobs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeaturedJobs();
    }, []);

    const SectionSkeleton = () => (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Recently Posted */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-cyan-200/50 dark:border-cyan-800/30 p-5 shadow-lg shadow-cyan-500/10 overflow-hidden">
                {/* Gradient accent at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500" />
                <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                            <Clock className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Recently Posted</h3>
                    </div>
                    <Link
                        href="/portal?sort_by=posted_at"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                        View all
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {isLoading ? (
                    <SectionSkeleton />
                ) : recentJobs.length > 0 ? (
                    <div className="space-y-3">
                        {recentJobs.slice(0, 3).map((job) => (
                            <PortalJobCard key={job.id} job={job} variant="compact" />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No recent jobs found
                    </p>
                )}
            </div>

            {/* Trending */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-5 shadow-lg shadow-amber-500/10 overflow-hidden">
                {/* Gradient accent at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Trending</h3>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Hot
                        </span>
                    </div>
                    <Link
                        href="/portal?sort_by=views_count"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                        View all
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {isLoading ? (
                    <SectionSkeleton />
                ) : trendingJobs.length > 0 ? (
                    <div className="space-y-3">
                        {trendingJobs.slice(0, 3).map((job) => (
                            <PortalJobCard key={job.id} job={job} variant="compact" />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No trending jobs found
                    </p>
                )}
            </div>
        </div>
    );
}
