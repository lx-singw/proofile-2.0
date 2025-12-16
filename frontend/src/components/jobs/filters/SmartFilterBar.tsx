'use client';

import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SmartFilterBarProps {
    onFilter: (query: string) => void;
    suggestions?: string[];
}

/**
 * SmartFilterBar - Natural language filter input
 */
export default function SmartFilterBar({ onFilter, suggestions = [] }: SmartFilterBarProps) {
    const [query, setQuery] = useState('');

    const defaultSuggestions = [
        'Remote jobs paying $150k+',
        'Startup with <50 employees',
        'No degree required',
        'Visa sponsorship available'
    ];

    const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onFilter(query)}
                    placeholder="Describe your ideal job in natural language..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {allSuggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setQuery(suggestion);
                            onFilter(suggestion);
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}
