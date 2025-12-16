'use client';

import React from 'react';

interface SkillData {
    skill: string;
    userLevel: number; // 0-100
    marketDemand: number; // 0-100
}

interface SkillHeatmapProps {
    skills: SkillData[];
}

/**
 * SkillHeatmap - "Your skills vs Market" visualization
 */
export default function SkillHeatmap({ skills }: SkillHeatmapProps) {
    const getHeatColor = (userLevel: number, marketDemand: number) => {
        const gap = marketDemand - userLevel;
        if (gap <= 0) return 'bg-green-500'; // You're ahead
        if (gap <= 20) return 'bg-emerald-500'; // Slight gap
        if (gap <= 40) return 'bg-emerald-500'; // Moderate gap
        return 'bg-red-500'; // Critical gap
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Skills vs Market Demand
            </h3>

            <div className="space-y-3">
                {skills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {skill.skill}
                        </span>

                        <div className="flex-1 flex items-center gap-2">
                            {/* Your Level */}
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${skill.userLevel}%` }}
                                />
                            </div>

                            {/* Gap Indicator */}
                            <div className={`w-3 h-3 rounded-full ${getHeatColor(skill.userLevel, skill.marketDemand)}`} />

                            {/* Market Demand */}
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${skill.marketDemand}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded" />
                    <span>Your Level</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded" />
                    <span>Market Demand</span>
                </div>
            </div>
        </div>
    );
}
