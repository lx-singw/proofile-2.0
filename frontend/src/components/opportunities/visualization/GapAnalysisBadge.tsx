'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, BookOpen, Plus, ChevronRight } from 'lucide-react';

interface Gap {
    skill: string;
    required: string; // e.g., "3+ Years"
    current: string; // e.g., "1 Year" or "None"
    severity: 'critical' | 'moderate' | 'minor';
    actions: {
        type: 'course' | 'verify' | 'add';
        label: string;
        url?: string;
    }[];
}

interface GapAnalysisBadgeProps {
    gaps: Gap[];
    maxDisplay?: number;
}

/**
 * GapAnalysisBadge - Visual indicator of skill gaps
 * 
 * Based on job_matching_ai_plan.md Section 4.4 "Gap Analysis View"
 */
export default function GapAnalysisBadge({ gaps, maxDisplay = 3 }: GapAnalysisBadgeProps) {
    const criticalCount = gaps.filter(g => g.severity === 'critical').length;
    const hasGaps = gaps.length > 0;

    if (!hasGaps) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">No skill gaps detected</span>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-emerald-500" />
                Skill Gaps ({gaps.length})
                {criticalCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                        {criticalCount} Critical
                    </span>
                )}
            </h4>

            <div className="space-y-3">
                {gaps.slice(0, maxDisplay).map((gap, i) => (
                    <div
                        key={i}
                        className={`
                            p-3 rounded-lg border
                            ${gap.severity === 'critical'
                                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                                : gap.severity === 'moderate'
                                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                            }
                        `}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {gap.skill}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Required: {gap.required} • You have: {gap.current}
                                </p>
                            </div>
                            <span className={`
                                text-xs px-2 py-0.5 rounded-full font-medium
                                ${gap.severity === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : gap.severity === 'moderate'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                                }
                            `}>
                                {gap.severity}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                            {gap.actions.map((action, j) => (
                                <button
                                    key={j}
                                    className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 text-gray-700 dark:text-gray-300"
                                >
                                    {action.type === 'course' && <BookOpen size={12} />}
                                    {action.type === 'verify' && <CheckCircle size={12} />}
                                    {action.type === 'add' && <Plus size={12} />}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {gaps.length > maxDisplay && (
                <button className="w-full mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1">
                    View all {gaps.length} gaps
                    <ChevronRight size={14} />
                </button>
            )}
        </div>
    );
}
