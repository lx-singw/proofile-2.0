'use client';

import React from 'react';
import { Star, Shield, User, MessageSquare, ThumbsUp } from 'lucide-react';

interface ReviewCardProps {
    author: {
        name: string;
        role: string;
        isVerified?: boolean;
        avatarUrl?: string;
    };
    rating: number; // 1-5
    text: string;
    date: string;
    dimensions?: { label: string; score: number }[];
    isStaked?: boolean;
    stakedPoints?: number;
}

/**
 * ReviewCard - The core review feed item
 * 
 * Based on ratings_plan.md Section 5.3 "Review Feed Cards"
 * Supports: Verified badge, Staked reviews, Dimension tags
 */
export default function ReviewCard({
    author,
    rating,
    text,
    date,
    dimensions = [],
    isStaked = false,
    stakedPoints = 0
}: ReviewCardProps) {
    const renderStars = (score: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                size={14}
                className={i < score ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
            />
        ));
    };

    return (
        <div className={`
            bg-white dark:bg-gray-800 rounded-xl border p-5 transition-all
            ${isStaked
                ? 'border-purple-300 dark:border-purple-700 shadow-md'
                : 'border-gray-200 dark:border-gray-700'}
        `}>
            {/* Staked Badge */}
            {isStaked && (
                <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400">
                    <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <Shield size={14} />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                        Staked Review • {stakedPoints} Points Risked
                    </span>
                </div>
            )}

            {/* Author Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {author.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        author.name.charAt(0)
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {author.name}
                        </span>
                        {author.isVerified && (
                            <div className="flex items-center gap-1 text-green-600 text-xs">
                                <Shield size={12} />
                                <span>Verified</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {author.role}
                    </p>
                </div>
                <span className="text-xs text-gray-400">{date}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex">{renderStars(rating)}</div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {rating}.0
                </span>
            </div>

            {/* Review Text */}
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                "{text}"
            </p>

            {/* Dimension Tags */}
            {dimensions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {dimensions.map((dim, i) => (
                        <span
                            key={i}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                            {dim.label}: {dim.score.toFixed(1)}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
