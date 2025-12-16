'use client';

import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SalaryRange {
    min: number;
    max: number;
    median: number;
    userTarget?: number;
}

interface SalaryInsightGraphProps {
    range: SalaryRange;
    location: string;
    role: string;
}

/**
 * SalaryInsightGraph - Market salary range visualization
 */
export default function SalaryInsightGraph({ range, location, role }: SalaryInsightGraphProps) {
    const formatSalary = (n: number) => `$${(n / 1000).toFixed(0)}k`;

    const userPosition = range.userTarget
        ? ((range.userTarget - range.min) / (range.max - range.min)) * 100
        : null;

    const getTrend = () => {
        if (!userPosition) return null;
        if (userPosition > 75) return { icon: TrendingUp, text: 'Above market', color: 'text-green-600' };
        if (userPosition > 40) return { icon: Minus, text: 'At market', color: 'text-blue-600' };
        return { icon: TrendingDown, text: 'Below market', color: 'text-yellow-600' };
    };

    const trend = getTrend();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900 dark:text-white">Salary Range</span>
            </div>

            <div className="text-sm text-gray-500 mb-4">
                {role} in {location}
            </div>

            {/* Range Bar */}
            <div className="relative">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{formatSalary(range.min)}</span>
                    <span className="font-medium text-green-600">{formatSalary(range.median)} median</span>
                    <span>{formatSalary(range.max)}</span>
                </div>

                <div className="h-3 bg-gradient-to-r from-blue-200 via-green-200 to-purple-200 rounded-full relative">
                    {/* Median marker */}
                    <div
                        className="absolute top-0 h-full w-0.5 bg-green-600"
                        style={{ left: '50%' }}
                    />

                    {/* User target marker */}
                    {userPosition !== null && (
                        <div
                            className="absolute -top-1 w-2 h-5 bg-purple-600 rounded"
                            style={{ left: `${userPosition}%`, transform: 'translateX(-50%)' }}
                        />
                    )}
                </div>
            </div>

            {/* Trend indicator */}
            {trend && (
                <div className={`flex items-center gap-1 mt-3 text-sm ${trend.color}`}>
                    <trend.icon className="w-4 h-4" />
                    <span>{trend.text}</span>
                </div>
            )}
        </div>
    );
}
