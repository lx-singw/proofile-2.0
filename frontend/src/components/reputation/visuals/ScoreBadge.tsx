'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface ScoreBadgeProps {
    score: number; // 0-5 scale
    size?: 'sm' | 'md' | 'lg';
    showStars?: boolean;
}

/**
 * ScoreBadge - The gold reputation score badge
 * 
 * Displays a prominent score (e.g., "4.8") with optional stars.
 * Based on ratings_plan.md Section 5.1 "Trust Score"
 */
export default function ScoreBadge({
    score,
    size = 'md',
    showStars = true
}: ScoreBadgeProps) {
    const getTier = (score: number): { label: string; bgClass: string; textClass: string } => {
        if (score >= 4.5) return { label: 'Exceptional', bgClass: 'bg-gradient-to-r from-yellow-400 to-yellow-600', textClass: 'text-yellow-900' };
        if (score >= 4.0) return { label: 'Excellent', bgClass: 'bg-gradient-to-r from-blue-400 to-blue-600', textClass: 'text-blue-900' };
        if (score >= 3.5) return { label: 'Good', bgClass: 'bg-gradient-to-r from-green-400 to-green-600', textClass: 'text-green-900' };
        if (score >= 3.0) return { label: 'Average', bgClass: 'bg-gradient-to-r from-gray-400 to-gray-600', textClass: 'text-gray-900' };
        return { label: 'Needs Work', bgClass: 'bg-gradient-to-r from-red-400 to-red-600', textClass: 'text-red-900' };
    };

    const tier = getTier(score);

    const sizeClasses = {
        sm: { container: 'px-3 py-1', score: 'text-lg', label: 'text-xs' },
        md: { container: 'px-4 py-2', score: 'text-2xl', label: 'text-xs' },
        lg: { container: 'px-6 py-3', score: 'text-4xl', label: 'text-sm' }
    };

    const sz = sizeClasses[size];

    return (
        <div className={`
            inline-flex flex-col items-center rounded-xl shadow-lg
            ${tier.bgClass} ${sz.container}
        `}>
            <div className="flex items-center gap-1">
                {showStars && <Star size={size === 'lg' ? 24 : 16} className="text-white fill-white" />}
                <span className={`font-bold text-white ${sz.score}`}>
                    {score.toFixed(1)}
                </span>
            </div>
            <span className={`font-medium text-white/90 ${sz.label}`}>
                {tier.label}
            </span>
        </div>
    );
}
