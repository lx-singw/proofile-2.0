"use client";

import Link from "next/link";
import { CheckCircle, Star, ArrowRight, Briefcase } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/useAuth";

// Components
import { HomeHeader } from "@/components/home/HomeHeader";
import { FeedView } from "@/components/home/FeedView";
import { UserProfileCard } from "@/components/home/UserProfileCard";
import HomeLeftSidebar from "@/components/home/HomeLeftSidebar";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import JobSearchSection from "@/components/portal/JobSearchSection";
import FeaturedSections from "@/components/portal/FeaturedSections";
import FilterSidebar from "@/components/portal/FilterSidebar";
import portalService from "@/services/portalService";
import { OpportunityTypeFilter, OpportunityCategory, OpportunityType } from "@/components/opportunities/OpportunityTypeFilter";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // Opportunity filter state (for guest view)
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory>(null);
  const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>([]);

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState<{
    category?: string;
    location?: string;
    experience_level?: string;
    job_type?: string;
    opportunity_category?: string;
    opportunity_types?: string[];
  }>({});

  // Facets from API
  const [facets, setFacets] = useState<any>(null);
  const [facetsLoading, setFacetsLoading] = useState(true);

  // Fetch facets on mount (for guest job portal)
  useEffect(() => {
    if (isLoggedIn) return; // Don't fetch for logged-in users

    const fetchFacets = async () => {
      try {
        setFacetsLoading(true);
        const response = await portalService.searchJobs({
          page: 1,
          size: 1
        });
        if (response?.facets) {
          setFacets(response.facets);
        }
      } catch (error) {
        console.error("Error fetching facets:", error);
      } finally {
        setFacetsLoading(false);
      }
    };
    fetchFacets();
  }, [isLoggedIn]);

  const handleFilterChange = useCallback((filterName: string, value: string | string[]) => {
    setSidebarFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    if (filterName === "opportunity_types" && Array.isArray(value)) {
      setSelectedTypes(value as OpportunityType[]);
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSidebarFilters({});
    setSelectedCategory(null);
    setSelectedTypes([]);
  }, []);

  const combinedOpportunityTypes = selectedTypes.length > 0
    ? selectedTypes
    : (sidebarFilters.opportunity_types || []) as OpportunityType[];

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30">
      {/* Session-Aware Header */}
      <HomeHeader />

      {/* Inclusive Banner - Both Views */}
      <section className="relative overflow-hidden py-3 border-b border-emerald-600/20">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 animate-gradient-x" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm sm:text-base text-white font-medium drop-shadow-sm">
            For <span className="font-bold">students</span>, <span className="font-bold">graduates</span>, <span className="font-bold">professionals</span>, <span className="font-bold">job seekers</span>, <span className="font-bold">freelancers</span>, and <span className="font-bold">everyone</span> building their future — Proofile is your platform.
          </p>
        </div>
      </section>

      {/* ========================================= */}
      {/* LOGGED-IN VIEW: Professional Feed */}
      {/* ========================================= */}
      {isLoggedIn ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - User Profile + Tools */}
            <div className="hidden lg:block flex-shrink-0 w-72 space-y-4">
              <UserProfileCard />
              <HomeLeftSidebar />
            </div>

            {/* Center Column - Professional Feed */}
            <div className="flex-1 min-w-0">
              <FeedView />
            </div>

            {/* Right Sidebar - Network Suggestions & Insights */}
            <div className="hidden xl:block flex-shrink-0 w-80 space-y-4">
              <HomeRightSidebar />
            </div>
          </div>

          {/* Mobile Sidebars */}
          <div className="lg:hidden mt-6 space-y-4">
            <UserProfileCard />
            <HomeLeftSidebar />
          </div>
          <div className="xl:hidden mt-6">
            <HomeRightSidebar />
          </div>
        </main>
      ) : (
        /* ========================================= */
        /* GUEST VIEW: Hero + Job Portal */
        /* ========================================= */
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-50/50 dark:from-gray-800 dark:via-emerald-950/30 dark:to-teal-950/30 py-10 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-400/25 to-purple-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full text-sm font-medium border border-emerald-500/20 mb-4 backdrop-blur-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold">Trusted by 10,000+ professionals</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">Find Your Next</span>
                    <br />
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Opportunity</span>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                    Browse thousands of verified job listings from South Africa's top employers. Build your verified profile for faster applications.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/start"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
                  >
                    <span className="relative flex items-center gap-2">
                      Create Free Profile
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-emerald-600 dark:text-emerald-400 font-semibold border-2 border-emerald-500/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all hover:scale-105 backdrop-blur-sm"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-600 dark:text-gray-400 mt-8">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Free to browse</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>No commitment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Get verified</span>
                </div>
              </div>
            </div>
          </section>

          {/* Job Portal Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Sidebar - Filters */}
              <div className="hidden lg:block flex-shrink-0 w-72 space-y-6">
                <FilterSidebar
                  facets={facets}
                  selectedFilters={sidebarFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  isLoading={facetsLoading}
                />
                <HomeLeftSidebar />
              </div>

              {/* Center Column - Job Listings */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">Latest Opportunities</h2>
                  </div>
                  <Link href="/portal" className="group inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all">
                    View all
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <OpportunityTypeFilter
                  selectedCategory={selectedCategory}
                  selectedTypes={selectedTypes}
                  onCategoryChange={setSelectedCategory}
                  onTypeChange={setSelectedTypes}
                  className="mb-4"
                />

                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <JobSearchSection
                    maxJobs={12}
                    showFilters={true}
                    className="py-4"
                    opportunityCategory={selectedCategory}
                    opportunityTypes={combinedOpportunityTypes}
                  />
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="hidden xl:block flex-shrink-0 w-80 space-y-6">
                <FeaturedSections />
                <HomeRightSidebar />
              </div>
            </div>

            {/* Mobile Sidebars */}
            <div className="lg:hidden mt-6 space-y-6">
              <HomeLeftSidebar />
            </div>
            <div className="xl:hidden lg:block hidden mt-6">
              <HomeRightSidebar />
            </div>
            <div className="lg:hidden mt-6">
              <HomeRightSidebar />
            </div>
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-400 py-12 mt-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-all">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            © 2024 Proofile. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
