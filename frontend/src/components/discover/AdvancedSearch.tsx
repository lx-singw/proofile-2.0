"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Search,
    Filter,
    MapPin,
    Briefcase,
    Star,
    CheckCircle,
    ChevronDown,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchFilters {
    query: string;
    role: string;
    location: string;
    skills: string[];
    verified: boolean;
    minRating: number | null;
}

interface AdvancedSearchProps {
    onSearch: (filters: SearchFilters) => void;
    isLoading?: boolean;
}

const SKILL_OPTIONS = [
    "React", "TypeScript", "Python", "Product Management", "UX Design",
    "Data Science", "Machine Learning", "Node.js", "AWS", "Leadership"
];

const ROLE_OPTIONS = [
    "Software Engineer", "Product Manager", "Designer", "Data Scientist",
    "Engineering Manager", "DevOps Engineer", "Mobile Developer"
];

const LOCATION_OPTIONS = [
    "Remote", "San Francisco, CA", "New York, NY", "Seattle, WA",
    "Austin, TX", "London, UK", "Berlin, Germany"
];

export function AdvancedSearch({ onSearch, isLoading }: AdvancedSearchProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        role: "",
        location: "",
        skills: [],
        verified: false,
        minRating: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(filters);
    };

    const clearFilters = () => {
        setFilters({
            query: "",
            role: "",
            location: "",
            skills: [],
            verified: false,
            minRating: null,
        });
    };

    const toggleSkill = (skill: string) => {
        setFilters(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const activeFilterCount = [
        filters.role,
        filters.location,
        filters.skills.length > 0,
        filters.verified,
        filters.minRating !== null
    ].filter(Boolean).length;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={filters.query}
                        onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                        placeholder="Search professionals by name, skills, or company..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`rounded-xl border-gray-200 dark:border-gray-700 ${showFilters ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700" : ""}`}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-2 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                <Button type="submit" disabled={isLoading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isLoading ? "Searching..." : "Search"}
                </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-5 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Filter Results</h3>
                        {activeFilterCount > 0 && (
                            <button type="button" onClick={clearFilters} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear all
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                            <select
                                value={filters.role}
                                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="">Any Role</option>
                                {ROLE_OPTIONS.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                            <select
                                value={filters.location}
                                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="">Any Location</option>
                                {LOCATION_OPTIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Min Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Minimum Rating</label>
                            <select
                                value={filters.minRating ?? ""}
                                onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value ? Number(e.target.value) : null }))}
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="">Any Rating</option>
                                <option value="4">4+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="5">5 Stars Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
                        <div className="flex flex-wrap gap-2">
                            {SKILL_OPTIONS.map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${filters.skills.includes(skill)
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Verified Only Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="verified-only"
                            checked={filters.verified}
                            onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="verified-only" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Show verified profiles only
                        </label>
                    </div>
                </div>
            )}
        </form>
    );
}
