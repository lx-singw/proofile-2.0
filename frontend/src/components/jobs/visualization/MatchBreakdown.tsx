'use client';

import React from 'react';

interface MatchDimension {
    label: string;
    score: number; // 0-100
    weight: number; // 0-1, how important this is
}

interface MatchBreakdownProps {
    dimensions: MatchDimension[];
    size?: number;
}

/**
 * MatchBreakdown - Radar chart showing job match dimensions
 * 
 * Based on job_matching_ai_plan.md Section 4.3
 * Dimensions: Skills, Experience, Culture, Education, Location
 */
export default function MatchBreakdown({ dimensions, size = 180 }: MatchBreakdownProps) {
    const center = size / 2;
    const radius = (size / 2) - 25;
    const angleStep = (2 * Math.PI) / dimensions.length;

    const getPoint = (index: number, value: number): { x: number; y: number } => {
        const angle = angleStep * index - Math.PI / 2;
        const r = (value / 100) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Create polygon paths
    const userPolygon = dimensions
        .map((dim, i) => {
            const { x, y } = getPoint(i, dim.score);
            return `${x},${y}`;
        })
        .join(' ');

    // Grid circles at 25%, 50%, 75%, 100%
    const gridLevels = [25, 50, 75, 100];

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Grid */}
                {gridLevels.map((level) => (
                    <polygon
                        key={level}
                        points={dimensions.map((_, i) => {
                            const { x, y } = getPoint(i, level);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        strokeDasharray={level < 100 ? "2,2" : "0"}
                    />
                ))}

                {/* Axis Lines */}
                {dimensions.map((_, i) => {
                    const { x, y } = getPoint(i, 100);
                    return (
                        <line
                            key={`axis-${i}`}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="#E5E7EB"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* User Score Polygon */}
                <polygon
                    points={userPolygon}
                    fill="rgba(147, 51, 234, 0.2)"
                    stroke="#9333EA"
                    strokeWidth="2"
                />

                {/* Data Points */}
                {dimensions.map((dim, i) => {
                    const { x, y } = getPoint(i, dim.score);
                    return (
                        <g key={`point-${i}`}>
                            <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#9333EA"
                                stroke="white"
                                strokeWidth="2"
                            />
                            {/* Score label */}
                            <text
                                x={x}
                                y={y - 10}
                                textAnchor="middle"
                                className="text-xs font-bold fill-purple-600"
                            >
                                {dim.score}%
                            </text>
                        </g>
                    );
                })}

                {/* Labels */}
                {dimensions.map((dim, i) => {
                    const { x, y } = getPoint(i, 115);
                    return (
                        <text
                            key={`label-${i}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs fill-gray-600 dark:fill-gray-400"
                        >
                            {dim.label}
                        </text>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {dimensions.map((dim, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className={`
                            w-2 h-2 rounded-full
                            ${dim.score >= 80 ? 'bg-green-500' : dim.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                        `} />
                        {dim.label}: {dim.score}%
                    </div>
                ))}
            </div>
        </div>
    );
}
