'use client';

import React from 'react';

interface TrustScoreRingProps {
    score: number; // 0-100
    size?: number; // Ring diameter in pixels
    showLabel?: boolean;
}

/**
 * TrustScoreRing - Animated SVG ring displaying trust score
 * 
 * Color Scale:
 * - 0-40: Red (Low Trust)
 * - 41-70: Yellow (Medium)
 * - 71-90: Blue (High)
 * - 91-100: Gold (Elite)
 */
export default function TrustScoreRing({
    score,
    size = 120,
    showLabel = true
}: TrustScoreRingProps) {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Determine color based on score
    const getColor = (score: number): string => {
        if (score >= 91) return '#FFD700'; // Gold
        if (score >= 71) return '#3B82F6'; // Blue
        if (score >= 41) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    const getLabel = (score: number): string => {
        if (score >= 91) return 'Elite';
        if (score >= 71) return 'High';
        if (score >= 41) return 'Medium';
        return 'Low';
    };

    const color = getColor(score);
    const label = getLabel(score);

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                />

                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: score >= 91 ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' : undefined
                    }}
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-3xl font-bold"
                    style={{ color }}
                >
                    {score}
                </span>
                {showLabel && (
                    <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}
