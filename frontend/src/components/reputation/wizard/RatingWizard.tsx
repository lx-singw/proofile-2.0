'use client';

/**
 * RatingWizard - Multi-step rating submission flow
 * 
 * Steps:
 * 1. Context - Relationship and work period
 * 2. Dimensions - Score each dimension (sliders)
 * 3. Text - Written feedback
 * 4. Review & Submit
 * 
 * Based on ratings_plan.md Section 5.2 "Rating Wizard"
 */

import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Star, Send, Eye, EyeOff,
    User, Building, Calendar, MessageSquare, CheckCircle, Loader2
} from 'lucide-react';

interface RatingWizardProps {
    token: string;
    requester: {
        name: string;
        avatarUrl?: string;
    };
    company: string;
    relationship: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

interface DimensionScore {
    slug: string;
    name: string;
    score: number;
}

const DIMENSIONS = [
    { slug: 'communication', name: 'Communication', description: 'Clear, concise, proactive' },
    { slug: 'reliability', name: 'Reliability', description: 'Delivers on commitments' },
    { slug: 'collaboration', name: 'Collaboration', description: 'Works well with others' },
    { slug: 'ownership', name: 'Ownership', description: 'Takes responsibility' },
    { slug: 'initiative', name: 'Initiative', description: 'Proactive problem-solver' },
];

export default function RatingWizard({
    token,
    requester,
    company,
    relationship,
    onSuccess,
    onClose
}: RatingWizardProps) {
    // Wizard state
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [overallScore, setOverallScore] = useState(4);
    const [dimensions, setDimensions] = useState<DimensionScore[]>(
        DIMENSIONS.map(d => ({ ...d, score: 4 }))
    );
    const [textContent, setTextContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [raterName, setRaterName] = useState('');
    const [raterEmail, setRaterEmail] = useState('');

    const totalSteps = 4;

    const updateDimensionScore = (slug: string, score: number) => {
        setDimensions(prev =>
            prev.map(d => d.slug === slug ? { ...d, score } : d)
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/ratings/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    overall_score: overallScore,
                    dimensions: Object.fromEntries(dimensions.map(d => [d.slug, d.score])),
                    text_content: textContent,
                    is_anonymous: isAnonymous,
                    rater_name: raterName,
                    rater_email: raterEmail
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to submit rating');
            }

            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
                <div
                    key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${s === step
                            ? 'bg-emerald-600 text-white scale-110'
                            : s < step
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }`}
                >
                    {s < step ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Rate {requester.name}
                </h2>
                <p className="text-gray-500">
                    Share your experience working together at {company}
                </p>
            </div>

            {/* Overall Score */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Overall Rating
                </label>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(score => (
                        <button
                            key={score}
                            onClick={() => setOverallScore(score)}
                            className="p-2 transition-transform hover:scale-110"
                        >
                            <Star
                                className={`h-10 w-10 ${score <= overallScore
                                        ? 'text-emerald-500 fill-emerald-500'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                    {overallScore === 5 && 'Exceptional'}
                    {overallScore === 4 && 'Excellent'}
                    {overallScore === 3 && 'Good'}
                    {overallScore === 2 && 'Fair'}
                    {overallScore === 1 && 'Poor'}
                </p>
            </div>

            {/* Context Info */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{company}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="capitalize">{relationship}</span>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Rate Specific Skills
                </h2>
                <p className="text-gray-500">
                    Move the sliders to rate each area
                </p>
            </div>

            <div className="space-y-6">
                {dimensions.map(dim => (
                    <div key={dim.slug} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {dim.name}
                                </span>
                                <p className="text-xs text-gray-500">{DIMENSIONS.find(d => d.slug === dim.slug)?.description}</p>
                            </div>
                            <span className="text-lg font-bold text-emerald-600">
                                {dim.score.toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={dim.score}
                            onChange={(e) => updateDimensionScore(dim.slug, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Needs work</span>
                            <span>Exceptional</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Add Written Feedback
                </h2>
                <p className="text-gray-500">
                    Share specific examples or comments (optional)
                </p>
            </div>

            <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={`What was it like working with ${requester.name}? Share specific examples...`}
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
                {textContent.length}/2000 characters
            </p>

            {/* Your Info */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Your Information</h3>

                <input
                    type="text"
                    value={raterName}
                    onChange={(e) => setRaterName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

                <input
                    type="email"
                    value={raterEmail}
                    onChange={(e) => setRaterEmail(e.target.value)}
                    placeholder="Your email (for verification)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

                {/* Anonymous toggle */}
                <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isAnonymous
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        }`}
                >
                    {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-sm">
                        {isAnonymous ? 'Anonymous to public' : 'Visible to public'}
                    </span>
                </button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Review & Submit
                </h2>
                <p className="text-gray-500">
                    Please review your rating before submitting
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                {/* Overall */}
                <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Overall Rating</span>
                    <div className="flex items-center gap-1">
                        {Array(5).fill(0).map((_, i) => (
                            <Star
                                key={i}
                                className={`h-5 w-5 ${i < overallScore ? 'text-emerald-500 fill-emerald-500' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                    {dimensions.map(dim => (
                        <div key={dim.slug} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{dim.name}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{dim.score.toFixed(1)}</span>
                        </div>
                    ))}
                </div>

                {/* Text preview */}
                {textContent && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            "{textContent.slice(0, 150)}{textContent.length > 150 && '...'}"
                        </p>
                    </div>
                )}

                {/* Visibility */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{isAnonymous ? 'Anonymous to public' : 'Your name will be visible'}</span>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full mx-auto overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                {renderStepIndicator()}
            </div>

            {/* Content */}
            <div className="p-6">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : onClose?.()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>

                {step < totalSteps ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                        Next
                        <ChevronRight className="h-5 w-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Submit Rating
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
