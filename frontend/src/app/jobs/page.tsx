'use client';

import { useEffect, useState } from 'react';
import { jobService, type JobRecommendation } from '@/services/jobService';
import { Bookmark, Building2, MapPin, Clock, DollarSign, Briefcase, Filter, Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function JobsPage() {
    const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await jobService.getAdvancedRecommendations();
                setRecommendations(data);
            } catch (error) {
                console.error('Failed to fetch job recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const getMatchColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-8 h-8 text-purple-600" />
                            Job Matches
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Opportunities matched to your profile and skills
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/jobs/saved"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Bookmark className="w-4 h-4" />
                            Saved Jobs
                        </Link>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <Search className="w-4 h-4" />
                            Search Jobs
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                                <Filter className="w-4 h-4" />
                                Filters
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        Match Score
                                    </label>
                                    <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
                                        <option>Any Score</option>
                                        <option>90% +</option>
                                        <option>80% +</option>
                                        <option>50% +</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        Job Type
                                    </label>
                                    <div className="space-y-2">
                                        {['Full-time', 'Contract', 'Remote'].map((type) => (
                                            <label key={type} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="lg:col-span-3 space-y-4">
                        {loading ? (
                            // Loading Skeletons
                            [1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
                                    <div className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
                                </div>
                            ))
                        ) : recommendations.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No matches found</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    Try updating your profile skills or headline to get better recommendations.
                                </p>
                            </div>
                        ) : (
                            recommendations.map(({ job, match_score, score_breakdown }) => (
                                <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                                        <Link href={`/jobs/${job.id}`}>
                                                            {job.title}
                                                        </Link>
                                                    </h2>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                                                        <Building2 className="w-4 h-4" />
                                                        <span className="font-medium">{job.company_name}</span>
                                                        <span>•</span>
                                                        <span className="text-sm">{job.location || 'Remote'}</span>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 ${getMatchColor(match_score)}`}>
                                                    <Sparkles className="w-4 h-4" />
                                                    {match_score}% Match
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 my-4">
                                                {job.job_type && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {job.job_type}
                                                    </span>
                                                )}
                                                {job.salary_range && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium">
                                                        <DollarSign className="w-3 h-3" />
                                                        {job.salary_range}
                                                    </span>
                                                )}
                                                {job.industry && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                                                        <Briefcase className="w-3 h-3" />
                                                        {job.industry}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Match Breakdown */}
                                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mt-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                                    Why you&apos;re a match
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                    {score_breakdown.title_match > 0 && (
                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Role matches your goal</span>
                                                        </div>
                                                    )}
                                                    {score_breakdown.skills_match > 0 && (
                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Skills overlap found</span>
                                                        </div>
                                                    )}
                                                    {score_breakdown.industry_match > 0 && (
                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Industry experience match</span>
                                                        </div>
                                                    )}
                                                    {score_breakdown.experience_match > 0 && (
                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Experience level aligns</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Score Bar */}
                                                <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${getScoreBarColor(match_score)} transition-all duration-500`}
                                                        style={{ width: `${Math.min(match_score, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 mt-4 md:mt-0 md:min-w-[140px]">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                Apply Now
                                            </Link>
                                            <button className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                Save Job
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
