"use client";

import React from "react";
import Link from "next/link";
import {
    MapPin,
    Building2,
    Clock,
    DollarSign,
    Briefcase,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import OpportunityBadge from "@/components/portal/OpportunityBadge";

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
}

interface PortalJobCardProps {
    job: PortalJob;
    variant?: "default" | "compact";
}

export default function PortalJobCard({ job, variant = "default" }: PortalJobCardProps) {
    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return "Recently";
        const date = new Date(dateString);
        const now = new Date();
        const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        return `${Math.floor(days / 7)}w ago`;
    };

    if (variant === "compact") {
        return (
            <Link
                href={`/portal/${job.slug || job.id}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        {job.company_logo_url ? (
                            <img src={job.company_logo_url} alt={job.company} className="w-6 h-6 object-contain" />
                        ) : (
                            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {job.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {job.company} • {job.location}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {job.opportunity_type && (
                            <OpportunityBadge type={job.opportunity_type} size="sm" showIcon={false} />
                        )}
                        {job.is_remote && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                Remote
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/portal/${job.slug || job.id}`}
            className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-700 transition-all group"
        >
            <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    {job.company_logo_url ? (
                        <img src={job.company_logo_url} alt={job.company} className="w-10 h-10 object-contain" />
                    ) : (
                        <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    )}
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {job.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                            Apply
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        {job.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                            </span>
                        )}
                        {job.salary_display && (
                            <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {job.salary_display}
                            </span>
                        )}
                        {job.job_type && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {job.job_type}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimeAgo(job.posted_at)}
                        </span>
                    </div>

                    {/* Skills & Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {/* Opportunity Type Badge */}
                        {job.opportunity_type && (
                            <OpportunityBadge type={job.opportunity_type} size="sm" />
                        )}
                        {job.is_remote && (
                            <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                Remote
                            </span>
                        )}
                        {job.skills?.slice(0, 3).map((skill) => (
                            <span
                                key={skill}
                                className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full"
                            >
                                {skill}
                            </span>
                        ))}
                        {job.skills && job.skills.length > 3 && (
                            <span className="px-2.5 py-0.5 text-gray-400 text-xs">
                                +{job.skills.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
