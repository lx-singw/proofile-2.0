"use client";

import React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface PortalFiltersProps {
    workTypes: FilterOption[];
    experienceLevels: FilterOption[];
    categories: FilterOption[];
    selectedWorkTypes: string[];
    selectedExperienceLevels: string[];
    selectedCategories: string[];
    onWorkTypeChange: (values: string[]) => void;
    onExperienceLevelChange: (values: string[]) => void;
    onCategoryChange: (values: string[]) => void;
    onClearAll: () => void;
}

export default function PortalFilters({
    workTypes,
    experienceLevels,
    categories,
    selectedWorkTypes,
    selectedExperienceLevels,
    selectedCategories,
    onWorkTypeChange,
    onExperienceLevelChange,
    onCategoryChange,
    onClearAll
}: PortalFiltersProps) {
    const toggleFilter = (
        value: string,
        selected: string[],
        onChange: (values: string[]) => void
    ) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const hasFilters = selectedWorkTypes.length > 0 ||
        selectedExperienceLevels.length > 0 ||
        selectedCategories.length > 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="w-5 h-5 text-emerald-500" />
                    Filters
                </h3>
                {hasFilters && (
                    <button
                        onClick={onClearAll}
                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                        <X className="w-4 h-4" />
                        Clear all
                    </button>
                )}
            </div>

            {/* Work Type */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Work Type</h4>
                <div className="space-y-2">
                    {workTypes.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedWorkTypes.includes(option.value)}
                                onChange={() => toggleFilter(option.value, selectedWorkTypes, onWorkTypeChange)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {option.label}
                            </span>
                            {option.count !== undefined && (
                                <span className="text-xs text-gray-400">({option.count})</span>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            {/* Experience Level */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Experience</h4>
                <div className="space-y-2">
                    {experienceLevels.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedExperienceLevels.includes(option.value)}
                                onChange={() => toggleFilter(option.value, selectedExperienceLevels, onExperienceLevelChange)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {option.label}
                            </span>
                            {option.count !== undefined && (
                                <span className="text-xs text-gray-400">({option.count})</span>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            {/* Category */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</h4>
                <div className="space-y-2">
                    {categories.slice(0, 5).map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(option.value)}
                                onChange={() => toggleFilter(option.value, selectedCategories, onCategoryChange)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {option.label}
                            </span>
                            {option.count !== undefined && (
                                <span className="text-xs text-gray-400">({option.count})</span>
                            )}
                        </label>
                    ))}
                </div>
                {categories.length > 5 && (
                    <button className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                        Show all categories
                    </button>
                )}
            </div>
        </div>
    );
}
