'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';

interface SalaryRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
}

/**
 * SalaryRangeSlider - Dual-thumb salary range filter
 */
export default function SalaryRangeSlider({
    min,
    max,
    step = 10000,
    value,
    onChange
}: SalaryRangeSliderProps) {
    const formatSalary = (n: number) => `$${(n / 1000).toFixed(0)}k`;

    const range = max - min;
    const leftPercent = ((value[0] - min) / range) * 100;
    const rightPercent = ((value[1] - min) / range) * 100;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Salary Range</span>
                </div>
                <span className="text-sm text-emerald-600 font-medium">
                    {formatSalary(value[0])} - {formatSalary(value[1])}
                </span>
            </div>

            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                {/* Active range */}
                <div
                    className="absolute h-full bg-emerald-500 rounded-full"
                    style={{
                        left: `${leftPercent}%`,
                        width: `${rightPercent - leftPercent}%`
                    }}
                />

                {/* Min thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={(e) => {
                        const newMin = Math.min(Number(e.target.value), value[1] - step);
                        onChange([newMin, value[1]]);
                    }}
                    className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                />

                {/* Max thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[1]}
                    onChange={(e) => {
                        const newMax = Math.max(Number(e.target.value), value[0] + step);
                        onChange([value[0], newMax]);
                    }}
                    className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatSalary(min)}</span>
                <span>{formatSalary(max)}</span>
            </div>
        </div>
    );
}
