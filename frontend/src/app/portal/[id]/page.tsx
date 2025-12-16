"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    MapPin,
    Building2,
    Clock,
    DollarSign,
    Briefcase,
    ExternalLink,
    Share2,
    Bookmark,
    CheckCircle,
    Sparkles,
    Zap,
    GraduationCap,
    Calendar
} from "lucide-react";

// Types
interface PortalJobDetail {
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
    is_remote: boolean;
    posted_at?: string;
    source: string;
    description?: string;
    source_url?: string;
    education_requirement?: string;
    years_experience_min?: number;
    years_experience_max?: number;
    expires_at?: string;
    views_count: number;
    applies_count: number;
    related_jobs: {
        id: number;
        title: string;
        company: string;
        location?: string;
    }[];
}

// Mock data
const MOCK_JOB: PortalJobDetail = {
    id: 1,
    slug: "senior-frontend-engineer-takealot",
    title: "Senior Frontend Engineer",
    company: "Takealot",
    location: "Cape Town, South Africa",
    location_type: "hybrid",
    salary_display: "ZAR 60,000 - 90,000 per month",
    skills: ["React", "TypeScript", "Next.js", "Node.js", "GraphQL"],
    experience_level: "senior",
    category: "technology",
    job_type: "full-time",
    is_remote: false,
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "careers24",
    description: `
## About the Role

We're looking for a Senior Frontend Engineer to join our growing team. You'll be working on our customer-facing e-commerce platform, building features used by millions of South Africans.

## Responsibilities

- Design and implement new frontend features using React and TypeScript
- Collaborate with product managers and designers to create exceptional user experiences
- Mentor junior developers and conduct code reviews
- Optimize application performance for mobile and web
- Write comprehensive tests and documentation

## Requirements

- 5+ years of experience in frontend development
- Strong proficiency in React, TypeScript, and modern JavaScript
- Experience with Next.js or similar frameworks
- Understanding of web performance optimization
- Excellent communication and collaboration skills

## Nice to Have

- Experience with GraphQL
- Knowledge of e-commerce platforms
- Contributions to open-source projects

## Benefits

- Competitive salary
- Medical aid contribution
- Flexible working hours
- Learning and development budget
- Employee discounts
    `,
    source_url: "https://careers24.com/job/12345",
    education_requirement: "Bachelor's degree in Computer Science or related field",
    years_experience_min: 5,
    years_experience_max: 10,
    views_count: 1234,
    applies_count: 45,
    related_jobs: [
        { id: 2, title: "Frontend Developer", company: "Superbalist", location: "Cape Town" },
        { id: 3, title: "React Engineer", company: "Yoco", location: "Cape Town" },
        { id: 4, title: "Full Stack Developer", company: "Luno", location: "Cape Town" },
    ]
};

export default function PortalJobPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<PortalJobDetail | null>(MOCK_JOB);
    const [isLoading, setIsLoading] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return "Recently";
        const date = new Date(dateString);
        const now = new Date();
        const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        return `${Math.floor(days / 7)} weeks ago`;
    };

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-gray-500">Job not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Back Button */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Jobs
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Job Details */}
                    <main className="flex-1">
                        {/* Header Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0">
                                    {job.company_logo_url ? (
                                        <img src={job.company_logo_url} alt={job.company} className="w-12 h-12 object-contain" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {job.title}
                                    </h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400">{job.company}</p>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
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
                                    Posted {formatTimeAgo(job.posted_at)}
                                </span>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {job.is_remote && (
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
                                        Remote Friendly
                                    </span>
                                )}
                                {job.experience_level && (
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
                                        {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                                    </span>
                                )}
                                {job.category && (
                                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
                                        {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => setShowApplyModal(true)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3"
                                >
                                    <Zap className="w-5 h-5 mr-2" />
                                    Apply with Proofile
                                </Button>
                                {job.source_url && (
                                    <a
                                        href={job.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button variant="outline" className="w-full rounded-xl py-3">
                                            <ExternalLink className="w-5 h-5 mr-2" />
                                            Apply on {job.source}
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Description</h2>
                            <div className="prose dark:prose-invert max-w-none">
                                {job.description?.split('\n').map((line, i) => {
                                    if (line.startsWith('## ')) {
                                        return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.replace('## ', '')}</h3>;
                                    } else if (line.startsWith('- ')) {
                                        return <li key={i} className="text-gray-600 dark:text-gray-400">{line.replace('- ', '')}</li>;
                                    } else if (line.trim()) {
                                        return <p key={i} className="text-gray-600 dark:text-gray-400">{line}</p>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Right Column - Sidebar */}
                    <aside className="w-full lg:w-80 space-y-6">
                        {/* Quick Apply CTA */}
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-6 h-6" />
                                <h3 className="font-bold text-lg">Quick Apply with Proofile</h3>
                            </div>
                            <ul className="space-y-2 mb-4 text-sm text-blue-100">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    One-click application
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Verified profile stands out
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Track your applications
                                </li>
                            </ul>
                            <Link href="/register">
                                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-xl">
                                    Create Free Account
                                </Button>
                            </Link>
                        </div>

                        {/* Job Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Job Details</h3>
                            <dl className="space-y-4 text-sm">
                                {job.education_requirement && (
                                    <div className="flex items-start gap-3">
                                        <GraduationCap className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Education</dt>
                                            <dd className="text-gray-900 dark:text-white">{job.education_requirement}</dd>
                                        </div>
                                    </div>
                                )}
                                {job.years_experience_min && (
                                    <div className="flex items-start gap-3">
                                        <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Experience</dt>
                                            <dd className="text-gray-900 dark:text-white">
                                                {job.years_experience_min}-{job.years_experience_max || job.years_experience_min}+ years
                                            </dd>
                                        </div>
                                    </div>
                                )}
                                {job.expires_at && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Deadline</dt>
                                            <dd className="text-gray-900 dark:text-white">
                                                {new Date(job.expires_at).toLocaleDateString()}
                                            </dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Related Jobs */}
                        {job.related_jobs && job.related_jobs.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Similar Jobs</h3>
                                <div className="space-y-3">
                                    {job.related_jobs.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/portal/${related.id}`}
                                            className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                {related.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {related.company} • {related.location}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Apply for {job.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Create a free Proofile account to apply with your verified profile.
                        </p>
                        <div className="space-y-3">
                            <Link href="/register">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3">
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Create Account & Apply
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" className="w-full rounded-xl py-3">
                                    Sign In
                                </Button>
                            </Link>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="w-full text-gray-500 dark:text-gray-400 text-sm hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
