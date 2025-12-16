'use client';

/**
 * TrendLine - Shows reputation score improvement over time
 * 
 * Displays a mini line chart showing score history.
 * Based on ratings_plan.md Section 5.1 "Trend: +0.2 this month"
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendLineProps {
    data: number[]; // Array of historical scores (oldest to newest)
    height?: number;
    showLabel?: boolean;
}

export default function TrendLine({
    data,
    height = 40,
    showLabel = true,
}: TrendLineProps) {
    if (data.length < 2) {
        return null;
    }

    const min = Math.min(...data) - 0.5;
    const max = Math.max(...data) + 0.5;
    const range = max - min || 1;

    const width = 100;
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = current - previous;

    const getTrendInfo = () => {
        if (change > 0.1) return { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' };
        if (change < -0.1) return { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
        return { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    };

    const trend = getTrendInfo();
    const TrendIcon = trend.icon;

    return (
        <div className="flex items-center gap-3">
            {/* Chart */}
            <svg
                width={width}
                height={height}
                className="overflow-visible"
                viewBox={`0 0 ${width} ${height}`}
            >
                {/* Background gradient */}
                <defs>
                    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={change >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={change >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <polygon
                    points={`0,${height} ${points} ${width},${height}`}
                    fill="url(#trendGradient)"
                />

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={change >= 0 ? '#10B981' : '#EF4444'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Current point */}
                <circle
                    cx={width}
                    cy={height - ((current - min) / range) * height}
                    r="3"
                    fill={change >= 0 ? '#10B981' : '#EF4444'}
                    stroke="white"
                    strokeWidth="2"
                />
            </svg>

            {/* Label */}
            {showLabel && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend.bg}`}>
                    <TrendIcon className={`h-4 w-4 ${trend.color}`} />
                    <span className={`text-sm font-medium ${trend.color}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                    </span>
                </div>
            )}
        </div>
    );
}
