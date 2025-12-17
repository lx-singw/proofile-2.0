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
                    per_page: 4
                });

                // For trending, we'd ideally sort by views/applies
                // Using same endpoint but different jobs for now
                const trendingResponse = await portalService.searchJobs({
                    sort_by: "views_count",
                    sort_order: "desc",
                    per_page: 4
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
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Recently Posted</h3>
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
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Trending</h3>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
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
