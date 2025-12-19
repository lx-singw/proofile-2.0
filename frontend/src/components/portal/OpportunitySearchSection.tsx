"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Search,
    MapPin,
    Filter,
    Clock,
    Building2,
    Zap,
    Sparkles,
} from "lucide-react";
import portalService, { PortalJobCard } from "@/services/portalService";
import { OpportunityTypeFilter, OpportunityCategory, OpportunityType } from "@/components/opportunities/OpportunityTypeFilter";

// Mock data for fallback when API is unavailable
const MOCK_OPPORTUNITIES: PortalJobCard[] = [
    {
        id: 1,
        slug: "senior-frontend-engineer-takealot",
        title: "Senior Frontend Engineer",
        company: "Takealot",
        location: "Cape Town, South Africa",
        location_type: "hybrid",
        salary_display: "ZAR 60,000 - 90,000",
        skills: ["React", "TypeScript", "Next.js"],
        experience_level: "senior",
        category: "technology",
        job_type: "full-time",
        is_remote: false,
        posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: "careers24"
    },
    {
        id: 2,
        slug: "data-scientist-fnb",
        title: "Data Scientist",
        company: "FNB",
        location: "Johannesburg, South Africa",
        location_type: "onsite",
        salary_display: "ZAR 70,000 - 100,000",
        skills: ["Python", "Machine Learning", "SQL"],
        experience_level: "mid",
        category: "technology",
        job_type: "full-time",
        is_remote: false,
        posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        source: "pnet"
    },
    {
        id: 3,
        slug: "product-manager-discovery",
        title: "Product Manager",
        company: "Discovery",
        location: "Remote, South Africa",
        location_type: "remote",
        salary_display: "ZAR 80,000 - 120,000",
        skills: ["Product Strategy", "Agile", "Analytics"],
        experience_level: "senior",
        category: "product",
        job_type: "full-time",
        is_remote: true,
        posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        source: "linkedin"
    },
];

interface OpportunitySearchSectionProps {
    maxItems?: number;
    showFilters?: boolean;
    className?: string;
    opportunityCategory?: "jobs" | "training_skills_programs" | null;
    opportunityTypes?: string[];
}

export default function OpportunitySearchSection({
    maxItems = 12,
    showFilters = true,
    className = "",
    opportunityCategory = null,
    opportunityTypes = []
}: OpportunitySearchSectionProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [location, setLocation] = useState("");
    const [items, setItems] = useState<PortalJobCard[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [filters, setFilters] = useState({
        location_type: "",
        experience_level: "",
        job_type: "",
        category: ""
    });
    const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory>(opportunityCategory);
    const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>((opportunityTypes as OpportunityType[]) || []);

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return "Recently";
        const date = new Date(dateString);
        const now = new Date();
        const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        return `${Math.floor(days / 7)} weeks ago`;
    };

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await portalService.searchJobs({
                q: searchQuery || undefined,
                location: location || undefined,
                location_type: filters.location_type || undefined,
                experience_level: filters.experience_level || undefined,
                job_type: filters.job_type || undefined,
                category: filters.category || undefined,
                opportunity_category: selectedCategory || undefined,
                opportunity_types: selectedTypes.length > 0 ? selectedTypes : undefined,
                page: 1,
                size: maxItems,
                sort_by: "posted_at",
                sort_order: "desc"
            });
            setItems(response.jobs);
            setTotalItems(response.total);
            setHasMore(response.has_next);
        } catch (error) {
            console.error("Failed to fetch opportunities:", error);
            let filteredMock = MOCK_OPPORTUNITIES;
            if (selectedCategory || selectedTypes.length > 0) {
                filteredMock = MOCK_OPPORTUNITIES.slice(0, Math.max(1, MOCK_OPPORTUNITIES.length - selectedTypes.length));
            }
            setItems(filteredMock.slice(0, maxItems));
            setTotalItems(filteredMock.length);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, location, filters, maxItems, selectedCategory, selectedTypes]);

    useEffect(() => {
        fetchItems();
    }, [selectedCategory, selectedTypes]);

    useEffect(() => {
        if (opportunityCategory !== undefined) setSelectedCategory(opportunityCategory);
        if (opportunityTypes !== undefined) setSelectedTypes(opportunityTypes as OpportunityType[]);
    }, [opportunityCategory, opportunityTypes]);

    const handleSearch = () => {
        fetchItems();
    };

    return (
        <section className={`py-6 ${className}`}>
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto px-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex flex-col sm:flex-row gap-2 flex-1">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg min-w-0">
                                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Opportunity title, skills, or company"
                                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none min-w-0"
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>

                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg min-w-0">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Location"
                                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none min-w-0"
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto"
                        >
                            {isLoading ? "..." : "Search"}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {["Remote", "Entry Level", "Tech Hub", "Finance"].map((tag) => (
                        <button
                            key={tag}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {showFilters && (
                    <div className="mt-6 flex justify-center">
                        <OpportunityTypeFilter
                            selectedCategory={selectedCategory}
                            selectedTypes={selectedTypes}
                            onCategoryChange={setSelectedCategory}
                            onTypeChange={setSelectedTypes}
                            className="max-w-2xl w-full"
                        />
                    </div>
                )}
            </div>

            {/* Opportunities Grid */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{items.length}</span> of {totalItems} opportunities
                    </p>
                    <Link href="/portal" className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1">
                        View all opportunities →
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {items.map((item) => (
                            <Link
                                key={item.id}
                                href={`/portal/${item.slug || item.id}`}
                                className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                        {item.company_logo_url ? (
                                            <img src={item.company_logo_url} alt={item.company} className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400">{item.company}</p>
                                            </div>
                                            {item.salary_display && (
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                                                    {item.salary_display}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {item.location?.split(",")[0] || "South Africa"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatTimeAgo(item.posted_at)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {item.skills?.slice(0, 4).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className="mt-8 text-center">
                        <Link href="/portal">
                            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl">
                                <Sparkles className="w-5 h-5 mr-2" />
                                Browse All {totalItems} Opportunities
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
