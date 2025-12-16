"use client";

import React from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalSearchBarProps {
    searchQuery: string;
    location: string;
    onSearchChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onSearch: () => void;
    isLoading?: boolean;
}

export default function PortalSearchBar({
    searchQuery,
    location,
    onSearchChange,
    onLocationChange,
    onSearch,
    isLoading = false
}: PortalSearchBarProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
                {/* Job Search */}
                <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Job title, skills, or company"
                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>

                {/* Location */}
                <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => onLocationChange(e.target.value)}
                        placeholder="Location (e.g., Cape Town)"
                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>

                {/* Search Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold"
                >
                    {isLoading ? "Searching..." : "Search Jobs"}
                </Button>
            </div>
        </form>
    );
}
