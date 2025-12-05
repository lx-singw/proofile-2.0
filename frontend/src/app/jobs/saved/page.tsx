'use client';

import { useEffect, useState } from 'react';
import { jobService, type Job } from '@/services/jobService';
import { Bookmark, Building2, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function SavedJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedJobs = async () => {
            try {
                const savedJobs = await jobService.getSavedJobs();
                setJobs(savedJobs);
            } catch (error) {
                console.error('Failed to fetch saved jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedJobs();
    }, []);

    const handleUnsave = async (jobId: number) => {
        try {
            await jobService.unsaveJob(jobId);
            setJobs(jobs.filter(job => job.id !== jobId));
        } catch (error) {
            console.error('Failed to unsave job:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
            <DashboardHeader />
            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Saved Jobs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Jobs you've bookmarked for later review
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading saved jobs...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No saved jobs yet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start exploring jobs and save the ones you're interested in
                        </p>
                        <Link
                            href="/jobs"
                            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                            Browse Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <Link href={`/jobs/${job.id}`}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 mb-2">
                                                {job.title}
                                            </h3>
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-4">
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
                                        </div>
                                        {job.required_skills && job.required_skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {job.required_skills.slice(0, 5).map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {job.required_skills.length > 5 && (
                                                    <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                                                        +{job.required_skills.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUnsave(job.id)}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            title="Unsave job"
                                        >
                                            <Bookmark className="w-5 h-5 fill-current" />
                                        </button>
                                        <Link
                                            href={`/jobs/${job.id}`}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
