'use client';

import React from 'react';

interface RadarDataPoint {
    label: string;
    value: number; // 0-5 scale
}

interface RadarChartProps {
    data: RadarDataPoint[];
    size?: number;
    maxValue?: number;
}

/**
 * RadarChart - SVG-based skill breakdown visualization
 * 
 * Displays multiple dimensions on a radar/spider chart.
 * Based on ratings_plan.md Section 5.1 "Radar Breakdown"
 */
export default function RadarChart({
    data,
    size = 200,
    maxValue = 5
}: RadarChartProps) {
    const center = size / 2;
    const radius = (size / 2) - 30; // Leave room for labels
    const angleStep = (2 * Math.PI) / data.length;

    // Calculate point positions
    const getPoint = (index: number, value: number): { x: number; y: number } => {
        const angle = angleStep * index - Math.PI / 2; // Start from top
        const r = (value / maxValue) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Create polygon path
    const polygonPoints = data
        .map((point, i) => {
            const { x, y } = getPoint(i, point.value);
            return `${x},${y}`;
        })
        .join(' ');

    // Grid circles
    const gridLevels = [1, 2, 3, 4, 5];

    return (
        <div className="relative">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Grid */}
                {gridLevels.map((level) => (
                    <polygon
                        key={level}
                        points={data.map((_, i) => {
                            const { x, y } = getPoint(i, level);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis Lines */}
                {data.map((_, i) => {
                    const { x, y } = getPoint(i, maxValue);
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

                {/* Data Polygon */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="#3B82F6"
                    strokeWidth="2"
                />

                {/* Data Points */}
                {data.map((point, i) => {
                    const { x, y } = getPoint(i, point.value);
                    return (
                        <circle
                            key={`point-${i}`}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#3B82F6"
                            stroke="white"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Labels */}
                {data.map((point, i) => {
                    const { x, y } = getPoint(i, maxValue + 0.8);
                    return (
                        <text
                            key={`label-${i}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs fill-gray-600 dark:fill-gray-400 font-medium"
                        >
                            {point.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
