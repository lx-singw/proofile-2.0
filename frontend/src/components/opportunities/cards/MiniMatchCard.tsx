'use client';

import React from 'react';
import { Building2, MapPin, Sparkles, Bookmark } from 'lucide-react';
import Link from 'next/link';

interface MiniMatchCardProps {
    id: number;
    company: string;
    title: string;
    location: string;
    matchScore: number;
    isSaved?: boolean;
}

/**
 * MiniMatchCard - Condensed job card for list views
 */
export default function MiniMatchCard({
    id,
    company,
    title,
    location,
    matchScore,
    isSaved = false
}: MiniMatchCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
        if (score >= 70) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
        if (score >= 50) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    };

    return (
        <Link
            href={`/jobs/${id}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                {company.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{company}</span>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{location}</span>
                </div>
            </div>

            <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getScoreColor(matchScore)}`}>
                <Sparkles className="w-3 h-3" />
                {matchScore}%
            </div>

            {isSaved && (
                <Bookmark className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            )}
        </Link>
    );
}
