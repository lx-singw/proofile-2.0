"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Search,
    MapPin,
    Briefcase,
    Filter,
    ChevronDown,
    TrendingUp,
    Star,
    Clock,
    DollarSign,
    Building2,
    Zap,
    ArrowRight,
    Sparkles,
    Users,
    Loader2
} from "lucide-react";
import portalService, { PortalJobCard, PortalSearchResponse } from "@/services/portalService";

// Mock data for fallback when API is unavailable
const MOCK_JOBS: PortalJobCard[] = [
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

const CATEGORIES = [
    "Technology",
    "Finance",
    "Marketing",
    "Sales",
    "Engineering",
    "Healthcare",
    "Education",
    "Design"
];

const LOCATIONS = [
    "Johannesburg",
    "Cape Town",
    "Durban",
    "Pretoria",
    "Remote"
];

export default function PortalPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [location, setLocation] = useState("");
    const [jobs, setJobs] = useState<PortalJobCard[]>([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [sortBy, setSortBy] = useState<"posted_at" | "salary_max" | "views_count">("posted_at");
    const [filters, setFilters] = useState({
        location_type: "",
        experience_level: "",
        job_type: "",
        category: ""
    });

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

    const fetchJobs = useCallback(async (resetPage = true) => {
        setIsLoading(true);
        try {
            const response = await portalService.searchJobs({
                q: searchQuery || undefined,
                location: location || undefined,
                location_type: filters.location_type || undefined,
                experience_level: filters.experience_level || undefined,
                job_type: filters.job_type || undefined,
                category: filters.category || undefined,
                page: resetPage ? 1 : page,
                size: 20,
                sort_by: sortBy,
                sort_order: "desc"
            });

            if (resetPage) {
                setJobs(response.jobs);
                setPage(1);
            } else {
                setJobs(prev => [...prev, ...response.jobs]);
            }
            setTotalJobs(response.total);
            setHasMore(response.has_next);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            // Fallback to mock data if API fails
            setJobs(MOCK_JOBS);
            setTotalJobs(MOCK_JOBS.length);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, location, filters, page, sortBy]);

    // Initial fetch on mount
    useEffect(() => {
        fetchJobs(true);
    }, []);

    const handleSearch = () => {
        fetchJobs(true);
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
        fetchJobs(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Find Your Dream Job in South Africa
                        </h1>
                        <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
                            Browse {jobs.length.toLocaleString()}+ opportunities from top companies. No signup required.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 p-2 shadow-2xl flex flex-col md:flex-row gap-2">
                            {/* Job Search */}
                            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Job title, skills, or company"
                                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                                />
                            </div>

                            {/* Location */}
                            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Location"
                                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                                />
                            </div>

                            {/* Search Button */}
                            <Button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold"
                            >
                                {isLoading ? "Searching..." : "Search Jobs"}
                            </Button>
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-wrap justify-center gap-3 mt-6">
                            {["Remote Jobs", "Entry Level", "Tech Jobs", "Finance"].map((tag) => (
                                <button
                                    key={tag}
                                    className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-72 space-y-6">
                        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 border border-gray-100 dark:border-gray-700 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-emerald-500" />
                                    Filters
                                </h3>
                                <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                                    Clear all
                                </button>
                            </div>

                            {/* Work Type */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Work Type</h4>
                                <div className="space-y-2">
                                    {["Remote", "Hybrid", "On-site"].map((type) => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded text-emerald-600" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Experience Level */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Experience</h4>
                                <div className="space-y-2">
                                    {["Entry Level", "Mid Level", "Senior", "Lead/Manager"].map((level) => (
                                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded text-emerald-600" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</h4>
                                <div className="space-y-2">
                                    {CATEGORIES.slice(0, 5).map((cat) => (
                                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded text-emerald-600" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Signup CTA */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Get Matched</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Create a free profile and get AI-matched to jobs that fit your skills.
                            </p>
                            <Link href="/register">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 text-white rounded-xl">
                                    Create Free Account
                                </Button>
                            </Link>
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                Already have an account?{" "}
                                <Link href="/login" className="text-emerald-600 hover:underline">Sign in</Link>
                            </p>
                        </div>
                    </aside>

                    {/* Job Listings */}
                    <main className="flex-1">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{jobs.length}</span> jobs
                            </p>
                            <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
                                <option>Most Recent</option>
                                <option>Highest Salary</option>
                                <option>Most Views</option>
                            </select>
                        </div>

                        {/* Job Cards */}
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <Link
                                    key={job.id}
                                    href={`/portal/${job.slug || job.id}`}
                                    className="block bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-700 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center flex-shrink-0">
                                            {job.company_logo_url ? (
                                                <img src={job.company_logo_url} alt={job.company} className="w-10 h-10 object-contain" />
                                            ) : (
                                                <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                                            )}
                                        </div>

                                        {/* Job Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all duration-200 hover:scale-[1.02]">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Apply
                                                    <ArrowRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {job.location}
                                                    </span>
                                                )}
                                                {job.salary_display && (
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        {job.salary_display}
                                                    </span>
                                                )}
                                                {job.job_type && (
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-4 h-4" />
                                                        {job.job_type}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatTimeAgo(job.posted_at)}
                                                </span>
                                            </div>

                                            {/* Skills & Tags */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {job.is_remote && (
                                                    <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                                        Remote
                                                    </span>
                                                )}
                                                {job.skills?.slice(0, 3).map((skill) => (
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

                        {/* Load More */}
                        <div className="mt-8 text-center">
                            <Button variant="outline" className="rounded-xl px-8">
                                Load More Jobs
                            </Button>
                        </div>
                    </main>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="bg-gray-900 dark:bg-gray-950 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Matched?</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Create a verified Proofile and let AI match you with opportunities that fit your skills and experience.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 text-white px-8 py-3 rounded-xl">
                                <Zap className="w-5 h-5 mr-2" />
                                Create Free Account
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 rounded-xl">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
