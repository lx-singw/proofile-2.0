'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobService, type JobDetail } from '@/services/jobService';
import { Bookmark, Building2, MapPin, Clock, DollarSign, Briefcase, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const data = await jobService.getJobDetails(parseInt(resolvedParams.id));
                setJobDetail(data);
            } catch (error) {
                console.error('Failed to fetch job:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [resolvedParams.id]);

    const handleSaveJob = async () => {
        if (!jobDetail) return;

        setSaving(true);
        try {
            if (jobDetail.is_saved) {
                await jobService.unsaveJob(jobDetail.job.id);
                setJobDetail({ ...jobDetail, is_saved: false });
            } else {
                await jobService.saveJob(jobDetail.job.id);
                setJobDetail({ ...jobDetail, is_saved: true });
            }
        } catch (error) {
            console.error('Failed to save/unsave job:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-lg text-gray-600 dark:text-gray-400">Loading job details...</p>
            </div>
        );
    }

    if (!jobDetail) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Job not found</p>
                    <button
                        onClick={() => router.back()}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    const { job, is_saved, related_jobs } = jobDetail;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {job.company_name}
                                </span>
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {job.location}
                                </span>
                                {job.job_type && (
                                    <span className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        {job.job_type}
                                    </span>
                                )}
                                {job.experience_level && (
                                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm capitalize">
                                        {job.experience_level}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveJob}
                                disabled={saving}
                                className={`px-4 py-2 rounded-lg border transition-colors ${is_saved
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-600'
                                    }`}
                            >
                                <Bookmark className={`w-5 h-5 ${is_saved ? 'fill-current' : ''}`} />
                            </button>
                            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
                            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>

                        {job.required_skills && job.required_skills.length > 0 && (
                            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.required_skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Related Jobs */}
                        {related_jobs.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Similar Jobs</h2>
                                <div className="space-y-3">
                                    {related_jobs.map((relatedJob) => (
                                        <Link
                                            key={relatedJob.id}
                                            href={`/jobs/${relatedJob.id}`}
                                            className="block bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                                        >
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {relatedJob.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {relatedJob.company_name} • {relatedJob.location}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Job Details</h3>
                            <dl className="space-y-4">
                                {job.salary_range && (
                                    <div>
                                        <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">Salary Range</dt>
                                        <dd className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            {job.salary_range}
                                        </dd>
                                    </div>
                                )}
                                {job.industry && (
                                    <div>
                                        <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry</dt>
                                        <dd className="text-gray-900 dark:text-white font-medium">{job.industry}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">Posted</dt>
                                    <dd className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
