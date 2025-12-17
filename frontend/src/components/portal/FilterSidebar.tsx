"use client";

import React from "react";
import { X, Filter, ChevronDown, ChevronUp, MapPin, Briefcase, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacetItem {
    value: string;
    label: string;
    count: number;
}

interface Facets {
    categories?: FacetItem[];
    locations?: FacetItem[];
    experience_levels?: FacetItem[];
    job_types?: FacetItem[];
    opportunity_categories?: FacetItem[];
    opportunity_types?: FacetItem[];
    sources?: FacetItem[];
}

interface FilterSidebarProps {
    facets?: Facets;
    selectedFilters: {
        category?: string;
        location?: string;
        experience_level?: string;
        job_type?: string;
        opportunity_category?: string;
        opportunity_types?: string[];
    };
    onFilterChange: (filterName: string, value: string | string[]) => void;
    onClearFilters: () => void;
    isLoading?: boolean;
}

interface FilterSectionProps {
    title: string;
    icon: React.ElementType;
    items: FacetItem[];
    selectedValue?: string | string[];
    onSelect: (value: string) => void;
    multiSelect?: boolean;
    defaultExpanded?: boolean;
}

function FilterSection({
    title,
    icon: Icon,
    items,
    selectedValue,
    onSelect,
    multiSelect = false,
    defaultExpanded = true
}: FilterSectionProps) {
    const [expanded, setExpanded] = React.useState(defaultExpanded);

    const isSelected = (value: string) => {
        if (Array.isArray(selectedValue)) {
            return selectedValue.includes(value);
        }
        return selectedValue === value;
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {title}
                </span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {expanded && (
                <div className="mt-2 space-y-1">
                    {items.slice(0, 8).map((item) => (
                        <button
                            key={item.value}
                            onClick={() => onSelect(item.value)}
                            className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                                ${isSelected(item.value)
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                }
                            `}
                        >
                            <span className="truncate">{item.label}</span>
                            <span className={`
                                text-xs px-1.5 py-0.5 rounded-full
                                ${isSelected(item.value)
                                    ? "bg-emerald-200/50 dark:bg-emerald-800/50"
                                    : "bg-gray-200 dark:bg-gray-600"
                                }
                            `}>
                                {item.count}
                            </span>
                        </button>
                    ))}
                    {items.length > 8 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-1">
                            +{items.length - 8} more
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function FilterSidebar({
    facets,
    selectedFilters,
    onFilterChange,
    onClearFilters,
    isLoading = false
}: FilterSidebarProps) {
    const hasActiveFilters = Object.values(selectedFilters).some(v =>
        v && (Array.isArray(v) ? v.length > 0 : v.length > 0)
    );

    const activeFilterCount = Object.values(selectedFilters).reduce((count, v) => {
        if (!v) return count;
        if (Array.isArray(v)) return count + v.length;
        return count + 1;
    }, 0);

    return (
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 p-5 shadow-lg shadow-emerald-500/10 overflow-hidden">
            {/* Gradient accent at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pt-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                        <Filter className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Filters</h3>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs"
                    >
                        <X className="w-3 h-3 mr-1" />
                        Clear all
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
                                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Opportunity Types */}
                    <FilterSection
                        title="Opportunity Type"
                        icon={Briefcase}
                        items={facets?.opportunity_types || []}
                        selectedValue={selectedFilters.opportunity_types}
                        onSelect={(value) => {
                            const current = selectedFilters.opportunity_types || [];
                            const newValue = current.includes(value)
                                ? current.filter(v => v !== value)
                                : [...current, value];
                            onFilterChange("opportunity_types", newValue);
                        }}
                        multiSelect
                    />

                    {/* Locations */}
                    <FilterSection
                        title="Location"
                        icon={MapPin}
                        items={facets?.locations || []}
                        selectedValue={selectedFilters.location}
                        onSelect={(value) => onFilterChange("location",
                            selectedFilters.location === value ? "" : value
                        )}
                    />

                    {/* Experience Level */}
                    <FilterSection
                        title="Experience"
                        icon={Clock}
                        items={facets?.experience_levels || []}
                        selectedValue={selectedFilters.experience_level}
                        onSelect={(value) => onFilterChange("experience_level",
                            selectedFilters.experience_level === value ? "" : value
                        )}
                    />

                    {/* Job Type */}
                    <FilterSection
                        title="Job Type"
                        icon={Building2}
                        items={facets?.job_types || []}
                        selectedValue={selectedFilters.job_type}
                        onSelect={(value) => onFilterChange("job_type",
                            selectedFilters.job_type === value ? "" : value
                        )}
                    />

                    {/* Categories */}
                    <FilterSection
                        title="Category"
                        icon={Building2}
                        items={facets?.categories || []}
                        selectedValue={selectedFilters.category}
                        onSelect={(value) => onFilterChange("category",
                            selectedFilters.category === value ? "" : value
                        )}
                        defaultExpanded={false}
                    />
                </div>
            )}
        </div>
    );
}
