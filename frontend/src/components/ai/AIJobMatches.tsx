"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    TrendingUp,
    Star,
    Building2,
    Zap,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobMatch {
    id: string;
    title: string;
    company: string;
    company_logo?: string;
    location: string;
    salary_range?: string;
    posted_at: string;
    match_score: number;
    match_reasons: string[];
    is_remote?: boolean;
    is_featured?: boolean;
}

interface AIJobMatchesProps {
    matches: JobMatch[];
    onViewJob: (id: string) => void;
    onApply: (id: string) => void;
    isLoading?: boolean;
}

export function AIJobMatches({ matches, onViewJob, onApply, isLoading }: AIJobMatchesProps) {
    const getMatchColor = (score: number) => {
        if (score >= 90) return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
        if (score >= 75) return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30";
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700";
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Zap className="w-8 h-8 text-emerald-500 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400">Finding your perfect matches...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">AI Job Matches</h3>
                </div>
                <Link href="/jobs" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                    View All
                    <ExternalLink className="w-3 h-3" />
                </Link>
            </div>

            {/* Job Cards */}
            <div className="space-y-3">
                {matches.map((job) => (
                    <div
                        key={job.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl border transition-all hover:shadow-md ${job.is_featured
                                ? "border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-100 dark:ring-emerald-900/30"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                    >
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Company Logo */}
                                <div className="flex-shrink-0">
                                    {job.company_logo ? (
                                        <Image
                                            src={job.company_logo}
                                            alt={job.company}
                                            width={48}
                                            height={48}
                                            className="rounded-lg object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Job Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {job.title}
                                        </h4>
                                        {job.is_featured && (
                                            <Star className="w-4 h-4 text-emerald-500 fill-emerald-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>

                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {job.is_remote ? "Remote" : job.location}
                                        </span>
                                        {job.salary_range && (
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                {job.salary_range}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {job.posted_at}
                                        </span>
                                    </div>
                                </div>

                                {/* Match Score */}
                                <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold ${getMatchColor(job.match_score)}`}>
                                    {job.match_score}%
                                </div>
                            </div>

                            {/* Match Reasons */}
                            {job.match_reasons.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                        <TrendingUp className="w-3 h-3 text-green-500" />
                                        <span>Why you match:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {job.match_reasons.map((reason, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-md"
                                            >
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onViewJob(job.id)}
                                    className="flex-1 rounded-lg border-gray-200 dark:border-gray-700"
                                >
                                    View Details
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => onApply(job.id)}
                                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Quick Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Sample data generator
export function generateSampleJobMatches(): JobMatch[] {
    return [
        {
            id: "1",
            title: "Senior Frontend Engineer",
            company: "Stripe",
            location: "San Francisco, CA",
            salary_range: "$180k - $250k",
            posted_at: "2d ago",
            match_score: 95,
            match_reasons: ["React expert", "5+ years exp", "TypeScript"],
            is_featured: true,
        },
        {
            id: "2",
            title: "Staff Software Engineer",
            company: "Notion",
            location: "Remote",
            salary_range: "$200k - $280k",
            posted_at: "1w ago",
            match_score: 88,
            match_reasons: ["Full-stack skills", "Startup experience"],
            is_remote: true,
        },
        {
            id: "3",
            title: "Engineering Manager",
            company: "Figma",
            location: "San Francisco, CA",
            salary_range: "$220k - $300k",
            posted_at: "3d ago",
            match_score: 82,
            match_reasons: ["Leadership skills", "Design systems"],
        },
    ];
}
