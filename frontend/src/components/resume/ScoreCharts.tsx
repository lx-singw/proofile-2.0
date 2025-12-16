"use client";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ScoreCircleProps {
    score: number;
    label: string;
    maxScore?: number;
}

export function ScoreCircle({ score, label, maxScore = 100 }: ScoreCircleProps) {
    const percentage = (score / maxScore) * 100;

    const getColor = (val: number) => {
        if (val >= 80) return '#10B981'; // green
        if (val >= 60) return '#F59E0B'; // yellow
        return '#EF4444'; // red
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24">
                <CircularProgressbar
                    value={percentage}
                    text={`${score}`}
                    styles={buildStyles({
                        textSize: '28px',
                        pathColor: getColor(percentage),
                        textColor: getColor(percentage),
                        trailColor: '#E5E7EB',
                        pathTransitionDuration: 1.5,
                    })}
                />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {label}
            </span>
        </div>
    );
}

interface ScoreBarProps {
    score: number;
    label: string;
    maxScore?: number;
}

export function ScoreBar({ score, label, maxScore = 100 }: ScoreBarProps) {
    const percentage = (score / maxScore) * 100;

    const getColor = (val: number) => {
        if (val >= 80) return 'bg-green-500';
        if (val >= 60) return 'bg-emerald-500';
        return 'bg-red-500';
    };

    const getTextColor = (val: number) => {
        if (val >= 80) return 'text-green-600';
        if (val >= 60) return 'text-emerald-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </span>
                <span className={`text-sm font-bold ${getTextColor(percentage)}`}>
                    {score}/{maxScore}
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full ${getColor(percentage)} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

interface ScoreGridProps {
    scores: Record<string, number>;
    type?: 'circle' | 'bar';
}

export function ScoreGrid({ scores, type = 'circle' }: ScoreGridProps) {
    const Component = type === 'circle' ? ScoreCircle : ScoreBar;

    return (
        <div className={`grid ${type === 'circle' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1'} gap-6`}>
            {Object.entries(scores).map(([key, value]) => (
                <Component
                    key={key}
                    score={value}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                />
            ))}
        </div>
    );
}
