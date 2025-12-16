'use client';

import React from 'react';
import { Building2, MapPin, DollarSign, Clock, Bookmark, CheckCircle, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface MatchReason {
    type: 'verified_skill' | 'experience' | 'culture_fit' | 'education';
    text: string;
    isVerified: boolean;
}

interface JobMatchCardProps {
    id: number;
    company: string;
    title: string;
    location: string;
    salary?: string;
    matchScore: number; // 0-100
    matchExplanation: string;
    matchReasons: MatchReason[];
    postedDate?: string;
    isSaved?: boolean;
    onSave?: () => void;
    onApply?: () => void;
}

/**
 * JobMatchCard - The core Job Intelligence UI element
 * 
 * Based on job_matching_ai_plan.md Section 4.3
 * Features: Match score with color, AI explanation, verified skill badges, gap analysis link
 */
export default function JobMatchCard({
    id,
    company,
    title,
    location,
    salary,
    matchScore,
    matchExplanation,
    matchReasons,
    postedDate,
    isSaved = false,
    onSave,
    onApply
}: JobMatchCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 85) return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-200' };
        if (score >= 70) return { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-200' };
        if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-200' };
        return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-200' };
    };

    const scoreColors = getScoreColor(matchScore);

    const getReasonIcon = (type: string, isVerified: boolean) => {
        if (isVerified) return <CheckCircle size={14} className="text-green-500" />;
        return <AlertTriangle size={14} className="text-yellow-500" />;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Company Logo Placeholder */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {company.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {company}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {title}
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={onSave}
                    className={`p-2 rounded-lg transition-colors ${isSaved
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                        }`}
                >
                    <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
                </button>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {location}
                </span>
                {salary && (
                    <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                        <DollarSign size={14} />
                        {salary}
                    </span>
                )}
                {postedDate && (
                    <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {postedDate}
                    </span>
                )}
            </div>

            {/* Match Score Badge */}
            <div className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                ${scoreColors.bg} bg-opacity-10 ${scoreColors.text} mb-4
            `}>
                <Sparkles size={16} />
                <span className="font-bold">{matchScore}% MATCH</span>
            </div>

            {/* AI Explanation */}
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 italic">
                "{matchExplanation}"
            </p>

            {/* Match Reasons */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Why It Matches
                </h4>
                <div className="space-y-2">
                    {matchReasons.slice(0, 3).map((reason, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                            {getReasonIcon(reason.type, reason.isVerified)}
                            <span className="text-gray-700 dark:text-gray-300">
                                {reason.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={onApply}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={16} />
                    Apply with Tailored Resume
                </button>
                <Link
                    href={`/jobs/${id}/gap-analysis`}
                    className="py-2.5 px-4 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                    View Gap Analysis
                    <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );
}
