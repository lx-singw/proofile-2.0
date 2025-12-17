"use client";

import { useState } from "react";
import { Briefcase, GraduationCap, Users, FileText, Handshake, UserCheck, Building, Heart, Award } from "lucide-react";

// Types matching the database enums
export type OpportunityCategory = "jobs" | "training_skills_programs" | null;
export type OpportunityType =
    // Jobs category
    | "employment" | "contract" | "freelance" | "consulting" | "board" | "volunteer"
    // Training & Skills Programs category
    | "internship" | "learnership" | "apprenticeship";

interface OpportunityTypeFilterProps {
    selectedCategory: OpportunityCategory;
    selectedTypes: OpportunityType[];
    onCategoryChange: (category: OpportunityCategory) => void;
    onTypeChange: (types: OpportunityType[]) => void;
    className?: string;
}

const CATEGORY_OPTIONS = [
    { value: null, label: "All Opportunities", icon: Briefcase },
    { value: "jobs" as const, label: "Jobs", icon: Briefcase },
    { value: "training_skills_programs" as const, label: "Training & Skills", icon: GraduationCap },
];

const JOB_TYPE_OPTIONS = [
    { value: "employment" as const, label: "Employment", icon: Building, description: "Full-time/Part-time positions" },
    { value: "contract" as const, label: "Contract", icon: FileText, description: "Fixed-term contracts" },
    { value: "freelance" as const, label: "Freelance", icon: Users, description: "Project-based work" },
    { value: "consulting" as const, label: "Consulting", icon: Handshake, description: "Advisory roles" },
    { value: "board" as const, label: "Board", icon: Award, description: "Board positions" },
    { value: "volunteer" as const, label: "Volunteer", icon: Heart, description: "Unpaid opportunities" },
];

const TRAINING_TYPE_OPTIONS = [
    { value: "internship" as const, label: "Internship", icon: UserCheck, description: "Gain work experience" },
    { value: "learnership" as const, label: "Learnership", icon: GraduationCap, description: "Structured learning + work" },
    { value: "apprenticeship" as const, label: "Apprenticeship", icon: Award, description: "Trade/skill training" },
];

export function OpportunityTypeFilter({
    selectedCategory,
    selectedTypes,
    onCategoryChange,
    onTypeChange,
    className = "",
}: OpportunityTypeFilterProps) {
    const typeOptions = selectedCategory === "jobs"
        ? JOB_TYPE_OPTIONS
        : selectedCategory === "training_skills_programs"
            ? TRAINING_TYPE_OPTIONS
            : [];

    const handleTypeToggle = (type: OpportunityType) => {
        if (selectedTypes.includes(type)) {
            onTypeChange(selectedTypes.filter(t => t !== type));
        } else {
            onTypeChange([...selectedTypes, type]);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {CATEGORY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedCategory === option.value;

                    return (
                        <button
                            key={option.value ?? "all"}
                            onClick={() => {
                                onCategoryChange(option.value);
                                onTypeChange([]);
                            }}
                            className={`
                                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
                                whitespace-nowrap transition-all duration-200
                                ${isSelected
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                    : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700"
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {/* Type Pills - Only show when a specific category is selected */}
            {selectedCategory && typeOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedTypes.includes(option.value);

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleTypeToggle(option.value)}
                                title={option.description}
                                className={`
                                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                                    transition-all duration-200 hover:scale-[1.02]
                                    ${isSelected
                                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                                    }
                                `}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {option.label}
                            </button>
                        );
                    })}

                    {/* Clear filters button */}
                    {selectedTypes.length > 0 && (
                        <button
                            onClick={() => onTypeChange([])}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Active filter count */}
            {selectedTypes.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {selectedTypes.length} type{selectedTypes.length > 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}

export default OpportunityTypeFilter;
