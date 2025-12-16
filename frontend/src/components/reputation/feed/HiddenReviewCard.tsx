'use client';

/**
 * HiddenReviewCard - Blurred private review card
 * 
 * Shows for reviews marked as "private" or when user
 * hasn't unlocked full access.
 */

import React from 'react';
import { Lock, Eye } from 'lucide-react';

interface HiddenReviewCardProps {
    relationship: string;
    company: string;
    date: string;
    onUnlock?: () => void;
}

export default function HiddenReviewCard({
    relationship,
    company,
    date,
    onUnlock,
}: HiddenReviewCardProps) {
    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 overflow-hidden">
            {/* Blurred content */}
            <div className="blur-sm pointer-events-none select-none">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-4/6 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                    <Lock className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Private Review
                </p>
                <p className="text-xs text-gray-500 text-center max-w-[200px] mb-4">
                    From a {relationship} at {company}
                </p>

                {onUnlock && (
                    <button
                        onClick={onUnlock}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        Unlock Reviews
                    </button>
                )}

                <p className="text-xs text-gray-400 mt-3">{date}</p>
            </div>
        </div>
    );
}
