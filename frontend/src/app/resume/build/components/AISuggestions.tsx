'use client';

import React, { useState } from 'react';
import { Sparkles, X, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
    id: string;
    type: 'improvement' | 'warning' | 'tip';
    message: string;
    action?: string;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
    {
        id: '1',
        type: 'improvement',
        message: 'Consider adding metrics to your most recent role. Numbers make achievements more compelling.',
        action: 'Add Metrics'
    },
    {
        id: '2',
        type: 'tip',
        message: 'Your summary could be stronger. Try starting with your years of experience and key expertise.',
        action: 'View Examples'
    }
];

export default function AISuggestions() {
    const [isVisible, setIsVisible] = useState(true);
    const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

    if (!isVisible || suggestions.length === 0) return null;

    const handleDismiss = (id: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="fixed bottom-8 right-8 z-40 w-80 flex flex-col gap-3">
            {suggestions.map((suggestion) => (
                <div
                    key={suggestion.id}
                    className={cn(
                        "bg-white/90 backdrop-blur-md border rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-10 duration-500",
                        suggestion.type === 'improvement' ? "border-emerald-200" : "border-emerald-200"
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            suggestion.type === 'improvement' ? "bg-emerald-100 text-emerald-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                            {suggestion.type === 'improvement' ? <Sparkles size={16} /> : <Lightbulb size={16} />}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm text-gray-700 leading-snug mb-3">
                                {suggestion.message}
                            </p>

                            <div className="flex items-center gap-3">
                                {suggestion.action && (
                                    <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                                        {suggestion.action}
                                        <ArrowRight size={12} />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDismiss(suggestion.id)}
                                    className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDismiss(suggestion.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
