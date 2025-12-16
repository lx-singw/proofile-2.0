'use client';

/**
 * ReportAbuseModal - Report inappropriate reviews
 * 
 * Categories: Harassment, False Information, Spam, Other
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Flag, Loader2, CheckCircle } from 'lucide-react';

interface ReportAbuseModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviewId: string;
    reviewAuthor: string;
}

const REPORT_REASONS = [
    { value: 'harassment', label: 'Harassment or Bullying', description: 'Personal attacks, threats, or intimidation' },
    { value: 'false_info', label: 'False Information', description: 'Knowingly inaccurate claims about work history' },
    { value: 'conflict', label: 'Conflict of Interest', description: 'Reviewer has undisclosed bias' },
    { value: 'pii', label: 'Personal Information', description: 'Contains phone numbers, addresses, etc.' },
    { value: 'spam', label: 'Spam or Fake', description: 'Automated or incentivized review' },
    { value: 'other', label: 'Other', description: 'Something else not listed above' },
];

export default function ReportAbuseModal({
    isOpen,
    onClose,
    reviewId,
    reviewAuthor,
}: ReportAbuseModalProps) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!reason) return;

        setLoading(true);
        try {
            // Send report to moderation queue
            await fetch('/api/v1/ratings/moderation/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: reviewId,
                    reason,
                    details,
                }),
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting report:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Flag className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Report Review
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Report Submitted
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Our Trust & Safety team will review this within 24-48 hours.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">
                                Report a review from <strong>{reviewAuthor}</strong>. All reports are reviewed by our Trust & Safety team.
                            </p>

                            <div className="space-y-2 mb-4">
                                {REPORT_REASONS.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => setReason(r.value)}
                                        className={`w-full p-3 rounded-lg border text-left transition-all ${reason === r.value
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {r.label}
                                        </p>
                                        <p className="text-xs text-gray-500">{r.description}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Additional Details (optional)
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Provide any additional context..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!reason || loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-5 w-5" />
                                        Submit Report
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
