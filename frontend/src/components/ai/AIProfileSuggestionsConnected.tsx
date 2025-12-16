"use client";

import React from "react";
import { useProfileSuggestions, useApplySuggestion } from "@/hooks/useAI";
import { Wand2, RefreshCw, Check, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileSuggestion {
    id: string;
    type: "headline" | "summary" | "skill" | "experience";
    original?: string;
    suggestion: string;
    reason: string;
    impact: string;
}

interface AIProfileSuggestionsConnectedProps {
    onRefresh?: () => void;
}

/**
 * Connected version of AIProfileSuggestions that fetches data from backend
 */
export function AIProfileSuggestionsConnected({ onRefresh }: AIProfileSuggestionsConnectedProps) {
    const { data: suggestions = [], isLoading, refetch } = useProfileSuggestions();
    const applySuggestion = useApplySuggestion();
    const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const handleApply = (suggestion: ProfileSuggestion) => {
        applySuggestion.mutate(suggestion.id);
        setAppliedIds(prev => new Set([...prev, suggestion.id]));
    };

    const handleRefresh = () => {
        refetch();
        onRefresh?.();
    };

    const getTypeLabel = (type: ProfileSuggestion["type"]) => {
        const labels = {
            headline: "Headline",
            summary: "About",
            skill: "New Skill",
            experience: "Experience",
        };
        return labels[type];
    };

    const getTypeColor = (type: ProfileSuggestion["type"]) => {
        const colors = {
            headline: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            summary: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            skill: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            experience: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        };
        return colors[type];
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-500 via-pink-500 to-rose-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Wand2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">AI Profile Enhancement</h3>
                            <p className="text-white/80 text-sm">Smart suggestions to improve your profile</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="text-white hover:bg-white/20 rounded-lg"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Suggestions */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-3 animate-pulse" />
                        <p className="text-gray-500 dark:text-gray-400">Analyzing your profile...</p>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="p-8 text-center">
                        <Check className="w-8 h-8 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-900 dark:text-white font-medium">Your profile looks great!</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No suggestions at this time</p>
                    </div>
                ) : (
                    suggestions.map((suggestion: ProfileSuggestion) => (
                        <div key={suggestion.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(suggestion.type)}`}>
                                            {getTypeLabel(suggestion.type)}
                                        </span>
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            {suggestion.impact}
                                        </span>
                                    </div>

                                    <p className="text-gray-900 dark:text-white font-medium text-sm mb-1">
                                        {suggestion.suggestion}
                                    </p>

                                    <button
                                        onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
                                        className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        Why this suggestion?
                                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === suggestion.id ? "rotate-180" : ""}`} />
                                    </button>

                                    {expandedId === suggestion.id && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                            {suggestion.reason}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => handleApply(suggestion)}
                                    disabled={appliedIds.has(suggestion.id) || applySuggestion.isPending}
                                    className={`rounded-lg flex-shrink-0 ${appliedIds.has(suggestion.id)
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        }`}
                                >
                                    {appliedIds.has(suggestion.id) ? (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            Applied
                                        </>
                                    ) : (
                                        "Apply"
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
