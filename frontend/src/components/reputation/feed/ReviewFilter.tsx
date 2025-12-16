'use client';

/**
 * ReviewFilter - Filter reviews by relationship type
 * 
 * Options: All, Managers Only, Peers Only, Verified Only
 */

import React from 'react';
import { Filter, Shield, Users, UserCircle } from 'lucide-react';

interface ReviewFilterProps {
    value: 'all' | 'manager' | 'peer' | 'verified';
    onChange: (value: 'all' | 'manager' | 'peer' | 'verified') => void;
    counts?: {
        all: number;
        manager: number;
        peer: number;
        verified: number;
    };
}

const FILTERS = [
    { value: 'all' as const, label: 'All', icon: Filter },
    { value: 'manager' as const, label: 'Managers', icon: UserCircle },
    { value: 'peer' as const, label: 'Peers', icon: Users },
    { value: 'verified' as const, label: 'Verified', icon: Shield },
];

export default function ReviewFilter({
    value,
    onChange,
    counts,
}: ReviewFilterProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = value === filter.value;
                const count = counts?.[filter.value];

                return (
                    <button
                        key={filter.value}
                        onClick={() => onChange(filter.value)}
                        className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }
            `}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{filter.label}</span>
                        {count !== undefined && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
