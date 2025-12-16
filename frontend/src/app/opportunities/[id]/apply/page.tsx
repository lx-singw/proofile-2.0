'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileEdit, CheckCircle, Loader2 } from 'lucide-react';


export default function ApplyPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id;

    const [step, setStep] = useState<'preview' | 'tailoring' | 'review' | 'submitted'>('preview');
    const [isProcessing, setIsProcessing] = useState(false);

    const jobInfo = {
        title: 'Senior Product Manager',
        company: 'Stripe',
        matchScore: 92
    };

    const handleTailor = async () => {
        setIsProcessing(true);
        setStep('tailoring');
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        setStep('review');
        setIsProcessing(false);
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStep('submitted');
        setIsProcessing(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <Link
                    href={`/jobs/${jobId}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Job
                </Link>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {['Preview', 'AI Tailoring', 'Review', 'Submit'].map((label, i) => {
                        const stepIndex = ['preview', 'tailoring', 'review', 'submitted'].indexOf(step);
                        const isComplete = i < stepIndex;
                        const isCurrent = i === stepIndex;

                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                    ${isComplete ? 'bg-green-500 text-white' :
                                        isCurrent ? 'bg-emerald-600 text-white' :
                                            'bg-gray-200 dark:bg-gray-700 text-gray-500'}
                                `}>
                                    {isComplete ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={`text-sm ${isCurrent ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {label}
                                </span>
                                {i < 3 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />}
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    {step === 'preview' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Apply to {jobInfo.company}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Your current resume will be tailored by AI to highlight relevant experience for this {jobInfo.title} role.
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">AI Tailor will:</span>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-8">
                                    <li>• Reorder skills to match job requirements</li>
                                    <li>• Highlight relevant experience</li>
                                    <li>• Adjust phrasing to match company culture</li>
                                    <li>• Generate custom cover letter</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleTailor}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-emerald-700 flex items-center justify-center gap-2"
                            >
                                <FileEdit className="w-5 h-5" />
                                Start AI Tailoring
                            </button>
                        </>
                    )}

                    {step === 'tailoring' && (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 mx-auto text-emerald-500 animate-spin mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                AI is tailoring your resume...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Analyzing job requirements and optimizing your profile
                            </p>
                        </div>
                    )}

                    {step === 'review' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Review Tailored Application
                            </h2>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
                                <div className="text-sm text-gray-500 mb-2">Resume Preview</div>
                                <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded flex items-center justify-center text-gray-400">
                                    [Tailored Resume Preview]
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('preview')}
                                    className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Re-tailor
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="flex-1 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Submit Application
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'submitted' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Application Submitted!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Your tailored application has been sent to {jobInfo.company}
                            </p>
                            <Link
                                href="/jobs"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700"
                            >
                                Browse More Jobs
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
