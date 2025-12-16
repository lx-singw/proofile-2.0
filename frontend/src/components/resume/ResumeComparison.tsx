"use client";

import { TrendingUp, ArrowRight } from "lucide-react";

interface ScoreComparisonProps {
    current: number;
    potential: number;
    category: string;
}

function ScoreComparison({ current, potential, category }: ScoreComparisonProps) {
    const improvement = potential - current;
    const improvementPercent = Math.round((improvement / current) * 100);

    return (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {category}
                </p>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                            {current}
                        </div>
                        <div className="text-xs text-gray-500">Current</div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-green-600" />

                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {potential}
                        </div>
                        <div className="text-xs text-gray-500">Potential</div>
                    </div>
                </div>
            </div>

            <div className="ml-4 text-right">
                <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{improvement}</span>
                </div>
                <div className="text-xs text-gray-500">
                    {improvementPercent > 0 ? `+${improvementPercent}%` : '—'}
                </div>
            </div>
        </div>
    );
}

interface ResumeComparisonProps {
    currentScores: Record<string, number>;
    improvements?: string[];
}

export default function ResumeComparison({ currentScores, improvements = [] }: ResumeComparisonProps) {
    // Calculate potential scores (add 10-20 points to current, max 100)
    const potentialScores = Object.entries(currentScores).reduce((acc, [key, value]) => {
        const boost = Math.min(20, 100 - value); // Don't exceed 100
        acc[key] = Math.min(100, value + boost);
        return acc;
    }, {} as Record<string, number>);

    const avgCurrent = Math.round(
        Object.values(currentScores).reduce((a, b) => a + b, 0) / Object.values(currentScores).length
    );

    const avgPotential = Math.round(
        Object.values(potentialScores).reduce((a, b) => a + b, 0) / Object.values(potentialScores).length
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Improvement Potential
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    See how your resume scores could improve with AI refinements
                </p>
            </div>

            {/* Overall Comparison */}
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Overall Score
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold text-gray-600 dark:text-gray-400">
                                {avgCurrent}
                            </div>
                            <ArrowRight className="w-6 h-6 text-green-600" />
                            <div className="text-4xl font-bold text-green-600">
                                {avgPotential}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                            +{avgPotential - avgCurrent}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            points possible
                        </div>
                    </div>
                </div>
            </div>

            {/* Individual Score Comparisons */}
            <div className="space-y-3 mb-6">
                {Object.entries(currentScores).map(([category, score]) => (
                    <ScoreComparison
                        key={category}
                        category={category.charAt(0).toUpperCase() + category.slice(1)}
                        current={score}
                        potential={potentialScores[category]}
                    />
                ))}
            </div>

            {/* Key Improvements */}
            {improvements.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Key Improvements Available
                    </h3>
                    <ul className="space-y-2">
                        {improvements.slice(0, 5).map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{improvement}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
