'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { jobService, type JobRecommendation } from '@/services/jobService';
import { Bookmark, Building2, MapPin, Clock, DollarSign, Briefcase, Filter, Search, Sparkles, CheckCircle2, AlertCircle, Zap, BarChart2 } from 'lucide-react';
import Link from 'next/link';

import AgentStatusWidget from '@/components/jobs/agents/AgentStatusWidget';
import HunterLogStream from '@/components/jobs/agents/HunterLogStream';
import SmartFilterBar from '@/components/jobs/filters/SmartFilterBar';
import VerifiedToggle from '@/components/jobs/filters/VerifiedToggle';
import SalaryRangeSlider from '@/components/jobs/filters/SalaryRangeSlider';
import QuickApplyModal from '@/components/jobs/modals/QuickApplyModal';
import { JobsStatsBar } from '@/components/ui/QuickStatsBar';
import { JobsFAB } from '@/components/ui/FloatingActionButton';
import { FadeIn } from '@/components/ui/PageTransition';
import HelpTooltip, { HELP_CONTENT } from '@/components/ui/HelpTooltip';
import axios from 'axios';

export default function JobsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [salaryRange, setSalaryRange] = useState<[number, number]>([50000, 300000]);
    const [searchQuery, setSearchQuery] = useState('');

    // Quick Apply Modal
    const [quickApplyJob, setQuickApplyJob] = useState<{ id: number; title: string; company: string; score: number } | null>(null);

    // AI Agent States
    const [agents] = useState([
        { name: 'hunter' as const, status: 'active' as const, message: `Scanning ${recommendations.length} jobs` },
        { name: 'tailor' as const, status: 'idle' as const, message: 'Ready to customize' },
        { name: 'negotiator' as const, status: 'paused' as const, message: 'Premium feature' },
    ]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/jobs');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchJobs = async () => {
            if (!user) return; // Don't fetch if not authenticated

            try {
                setError(null);
                const data = await jobService.getAdvancedRecommendations();
                setRecommendations(data);
            } catch (err) {
                // Extract meaningful error message
                let errorMessage = 'Failed to load job recommendations';
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        errorMessage = 'Please log in to see job recommendations';
                    } else if (err.response?.data?.detail) {
                        errorMessage = err.response.data.detail;
                    }
                }
                setError(errorMessage);
                console.error('Failed to fetch job recommendations:', err instanceof Error ? err.message : err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchJobs();
        }
    }, [user]);

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

    // Show loading spinner while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Quick Stats Bar */}
            <JobsStatsBar
                matchesToday={recommendations.length}
                saved={recommendations.filter(r => r.matchScore >= 80).length}
                profileMatch={recommendations.length > 0 ? Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length) : 0}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FadeIn>
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

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
                            <Link
                                href="/jobs/agents"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Zap className="w-4 h-4" />
                                AI Agents
                            </Link>
                            <Link
                                href="/jobs/market"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <BarChart2 className="w-4 h-4" />
                                Market Intel
                            </Link>
                        </div>
                    </div>

                    {/* Smart Filter Bar */}
                    <div className="mb-6">
                        <SmartFilterBar
                            onFilter={(query) => setSearchQuery(query)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Filters Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Verified Toggle */}
                            <VerifiedToggle
                                enabled={verifiedOnly}
                                onChange={setVerifiedOnly}
                            />

                            {/* Salary Range */}
                            <SalaryRangeSlider
                                min={50000}
                                max={300000}
                                value={salaryRange}
                                onChange={setSalaryRange}
                            />

                            {/* AI Agents Status */}
                            <AgentStatusWidget agents={agents} />

                            {/* Hunter Log Stream */}
                            <HunterLogStream isLive={true} />
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
                                                <button
                                                    onClick={() => setQuickApplyJob({
                                                        id: job.id,
                                                        title: job.title,
                                                        company: job.company_name,
                                                        score: match_score
                                                    })}
                                                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    Quick Apply
                                                </button>
                                                <Link
                                                    href={`/jobs/${job.id}/gap-analysis`}
                                                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    Gap Analysis
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Apply Modal */}
                    {quickApplyJob && (
                        <QuickApplyModal
                            isOpen={!!quickApplyJob}
                            onClose={() => setQuickApplyJob(null)}
                            onSubmit={() => {
                                console.log('Applied to:', quickApplyJob);
                                setQuickApplyJob(null);
                            }}
                            job={{
                                title: quickApplyJob.title,
                                company: quickApplyJob.company,
                                matchScore: quickApplyJob.score
                            }}
                        />
                    )}
                </FadeIn>
            </main>

            {/* Mobile FAB */}
            <JobsFAB onQuickApply={() => quickApplyJob && setQuickApplyJob(null)} />
        </div>
    );
}
