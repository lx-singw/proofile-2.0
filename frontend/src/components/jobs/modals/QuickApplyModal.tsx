'use client';

import React, { useState } from 'react';
import { X, Sparkles, FileEdit, CheckCircle, Loader2 } from 'lucide-react';

interface QuickApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    job: {
        title: string;
        company: string;
        matchScore: number;
    };
}

/**
 * QuickApplyModal - One-click apply flow
 */
export default function QuickApplyModal({ isOpen, onClose, onSubmit, job }: QuickApplyModalProps) {
    const [step, setStep] = useState<'confirm' | 'tailoring' | 'done'>('confirm');

    if (!isOpen) return null;

    const handleApply = async () => {
        setStep('tailoring');
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStep('done');
        setTimeout(() => {
            onSubmit();
            onClose();
            setStep('confirm');
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                {step === 'confirm' && (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Quick Apply
                            </h2>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Apply to <strong>{job.title}</strong> at <strong>{job.company}</strong> with your AI-tailored resume.
                        </p>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{job.matchScore}% Match Score</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2"
                            >
                                <FileEdit className="w-4 h-4" />
                                Apply Now
                            </button>
                        </div>
                    </>
                )}

                {step === 'tailoring' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Tailoring your resume...
                        </h3>
                        <p className="text-sm text-gray-500">
                            Optimizing for {job.company}
                        </p>
                    </div>
                )}

                {step === 'done' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Application Sent!
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
}
