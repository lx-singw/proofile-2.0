'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, BookOpen, Plus, TrendingUp, Target } from 'lucide-react';

import GapAnalysisBadge from '@/components/opportunities/visualization/GapAnalysisBadge';

export default function GapAnalysisPage() {
    const params = useParams();
    const jobId = params.id;

    // Mock data - in production this would come from API
    const jobInfo = {
        title: 'Senior Product Manager',
        company: 'Stripe',
        matchScore: 78
    };

    const gaps = [
        {
            skill: 'Rust',
            required: '3+ Years',
            current: 'None',
            severity: 'critical' as const,
            actions: [
                { type: 'course' as const, label: 'View Rust Courses' },
                { type: 'add' as const, label: 'Add to Profile' }
            ]
        },
        {
            skill: 'Large Scale Data',
            required: 'Petabyte scale',
            current: 'Terabyte scale',
            severity: 'moderate' as const,
            actions: [
                { type: 'verify' as const, label: 'Verify Experience' }
            ]
        },
        {
            skill: 'Team Leadership',
            required: '10+ direct reports',
            current: '5 direct reports',
            severity: 'minor' as const,
            actions: [
                { type: 'add' as const, label: 'Update Profile' }
            ]
        }
    ];

    const recommendations = [
        { type: 'course', title: 'Rust for System Programmers', provider: 'Udacity', duration: '4 weeks' },
        { type: 'cert', title: 'AWS Big Data Specialty', provider: 'AWS', duration: '6 weeks' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <Link
                    href={`/jobs/${jobId}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Job
                </Link>

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Gap Analysis
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {jobInfo.title} at {jobInfo.company}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {jobInfo.matchScore}%
                            </div>
                            <div className="text-sm text-gray-500">Match Score</div>
                        </div>
                    </div>
                </div>

                {/* Gap Analysis */}
                <div className="mb-6">
                    <GapAnalysisBadge gaps={gaps} maxDisplay={10} />
                </div>

                {/* Recommendations */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Recommended Actions
                    </h2>
                    <div className="space-y-4">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{rec.title}</div>
                                        <div className="text-sm text-gray-500">{rec.provider} • {rec.duration}</div>
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                                    Start
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
