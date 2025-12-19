"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import portalService, { PortalJobDetail } from "@/services/portalService";
import {
    ArrowLeft,
    MapPin,
    Building2,
    Clock,
    DollarSign,
    Briefcase,
    ExternalLink,
    CheckCircle,
    Sparkles,
    Zap,
    GraduationCap,
    Calendar,
    Loader2
} from "lucide-react";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

export default function PortalJobPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [job, setJob] = useState<PortalJobDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAuthGate, setShowAuthGate] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            if (!params?.id) return;

            setIsLoading(true);
            try {
                const idParam = params.id as string;
                let data: PortalJobDetail;

                // Check if param is numeric ID or Slug
                if (/^\d+$/.test(idParam)) {
                    data = await portalService.getJobById(parseInt(idParam));
                } else {
                    data = await portalService.getJobBySlug(idParam);
                }
                setJob(data);
            } catch (error) {
                console.error("Failed to fetch job details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [params?.id]);

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

    const handleApply = async () => {
        if (!job) return;

        if (!isAuthenticated) {
            setShowAuthGate(true);
            return;
        }

        setIsApplying(true);
        try {
            // Record the click
            await portalService.recordApplyClick(job.id, "external");

            // Redirect to source
            if (job.source_url) {
                window.open(job.source_url, '_blank');
            }
        } catch (error) {
            console.error("Error applying:", error);
        } finally {
            setIsApplying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 text-lg">Job not found</p>
                <Button onClick={() => router.push('/portal')} variant="outline">
                    Back to Jobs
                </Button>
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
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                    {job.company_logo_url ? (
                                        <img src={job.company_logo_url} alt={job.company} className="w-12 h-12 object-contain" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
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
                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full">
                                        {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                                    </span>
                                )}
                                {job.category && (
                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full">
                                        {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleApply}
                                    disabled={isApplying}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3"
                                >
                                    {isApplying ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Zap className="w-5 h-5 mr-2" />
                                    )}
                                    {isAuthenticated ? 'Apply Now' : 'Apply with Proofile'}
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
                                            View Source
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Description</h2>
                            <div className="prose dark:prose-invert max-w-none">
                                {job.description_html ? (
                                    <div dangerouslySetInnerHTML={{ __html: job.description_html }} />
                                ) : (
                                    job.description?.split('\n').map((line, i) => {
                                        if (line.startsWith('## ')) {
                                            return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.replace('## ', '')}</h3>;
                                        } else if (line.startsWith('- ')) {
                                            return <li key={i} className="text-gray-600 dark:text-gray-400">{line.replace('- ', '')}</li>;
                                        } else if (line.trim()) {
                                            return <p key={i} className="text-gray-600 dark:text-gray-400">{line}</p>;
                                        }
                                        return null;
                                    })
                                )}
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
                        {/* Quick Apply CTA - Only show if not authenticated */}
                        {!isAuthenticated && (
                            <div className="bg-gradient-to-br from-emerald-600 to-emerald-600 rounded-2xl p-6 text-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-6 h-6" />
                                    <h3 className="font-bold text-lg">Quick Apply with Proofile</h3>
                                </div>
                                <ul className="space-y-2 mb-4 text-sm text-emerald-100">
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
                                    <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl">
                                        Create Free Account
                                    </Button>
                                </Link>
                            </div>
                        )}

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
                                            href={`/portal/${related.slug || related.id}`}
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

            {/* Auth Gate Modal */}
            <AuthGateModal
                isOpen={showAuthGate}
                onClose={() => setShowAuthGate(false)}
                actionType="apply"
                title={`Apply for ${job.title}`}
            />
        </div>
    );
}
