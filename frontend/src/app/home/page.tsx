"use client";

import Link from "next/link";
import { CheckCircle, Shield, Star, Zap, ArrowRight, ChevronDown, Briefcase } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import JobSearchSection from "@/components/portal/JobSearchSection";
import HomeLeftSidebar from "@/components/home/HomeLeftSidebar";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import FeaturedSections from "@/components/portal/FeaturedSections";
import FilterSidebar from "@/components/portal/FilterSidebar";
import portalService from "@/services/portalService";
import { OpportunityTypeFilter, OpportunityCategory, OpportunityType } from "@/components/opportunities/OpportunityTypeFilter";

export default function HomePage() {
  const [productOpen, setProductOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Opportunity filter state
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

  // Fetch facets on mount
  useEffect(() => {
    const fetchFacets = async () => {
      try {
        setFacetsLoading(true);
        const response = await portalService.searchJobs({
          page: 1,
          size: 1 // We just need facets
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
  }, []);

  // Handle filter changes from sidebar
  const handleFilterChange = useCallback((filterName: string, value: string | string[]) => {
    setSidebarFilters(prev => ({
      ...prev,
      [filterName]: value
    }));

    // Sync opportunity types with the main filter
    if (filterName === "opportunity_types" && Array.isArray(value)) {
      setSelectedTypes(value as OpportunityType[]);
    }
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSidebarFilters({});
    setSelectedCategory(null);
    setSelectedTypes([]);
  }, []);

  // Combined opportunity types from both filter sources
  const combinedOpportunityTypes = selectedTypes.length > 0
    ? selectedTypes
    : (sidebarFilters.opportunity_types || []) as OpportunityType[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30">
      {/* Header - Glass morphism with gradient accent */}
      <header className="relative border-b border-emerald-200/50 dark:border-emerald-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        {/* Subtle gradient line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/home" className="flex flex-col">
                <ProofileLogo size={32} showWordmark={true} />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-10">Beyond resumes. Proven digital professional identities.</span>
              </Link>
              <nav className="hidden lg:flex items-center gap-1">
                {/* Product Dropdown */}
                <div className="relative" onMouseEnter={() => setProductOpen(true)} onMouseLeave={() => setProductOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Product
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {productOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#verification" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Verification</div>
                        <div className="text-xs text-gray-500">Multi-layer credential verification</div>
                      </Link>
                      <Link href="#ratings" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Peer Ratings</div>
                        <div className="text-xs text-gray-500">Real feedback from colleagues</div>
                      </Link>
                      <Link href="#ai-matching" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">AI Matching</div>
                        <div className="text-xs text-gray-500">Smart opportunity discovery</div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Solutions Dropdown */}
                <div className="relative" onMouseEnter={() => setSolutionsOpen(true)} onMouseLeave={() => setSolutionsOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Solutions
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {solutionsOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#talent" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">For Talent</div>
                        <div className="text-xs text-gray-500">Build your verified profile</div>
                      </Link>
                      <Link href="#recruiters" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">For Recruiters</div>
                        <div className="text-xs text-gray-500">Find verified candidates</div>
                      </Link>
                      <Link href="#enterprise" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Enterprise</div>
                        <div className="text-xs text-gray-500">Team verification solutions</div>
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/portal" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  Jobs
                </Link>

                <Link href="#pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  Pricing
                </Link>

                {/* Resources Dropdown */}
                <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Resources
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {resourcesOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#blog" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Blog</div>
                        <div className="text-xs text-gray-500">Latest news and insights</div>
                      </Link>
                      <Link href="#docs" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Documentation</div>
                        <div className="text-xs text-gray-500">Guides and tutorials</div>
                      </Link>
                      <Link href="#help" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Help Center</div>
                        <div className="text-xs text-gray-500">Get support</div>
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-all duration-200 hover:scale-[1.02]">
                Sign in
              </Link>
              <Link href="/start" className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Inclusive Banner - Animated Gradient */}
      <section className="relative overflow-hidden py-3 border-b border-emerald-600/20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 animate-gradient-x" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm sm:text-base text-white font-medium drop-shadow-sm">
            For <span className="font-bold">students</span>, <span className="font-bold">graduates</span>, <span className="font-bold">apprentices</span>, <span className="font-bold">professionals</span>, <span className="font-bold">job seekers</span>, <span className="font-bold">career changers</span>, <span className="font-bold">remote workers</span>, <span className="font-bold">freelancers</span>, <span className="font-bold">recruiters</span>, and <span className="font-bold">everyone</span> building their future — Proofile is your platform.
          </p>
        </div>
      </section>

      {/* Hero Section - Vibrant with Blur Orbs */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-50/50 dark:from-gray-800 dark:via-emerald-950/30 dark:to-teal-950/30 py-10 border-b border-gray-200/50 dark:border-gray-700/50">
        {/* Floating blur orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 dark:from-emerald-500/20 dark:to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-400/25 to-purple-400/25 dark:from-teal-500/15 dark:to-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 dark:from-cyan-500/10 dark:to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              {/* Gradient badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 rounded-full text-sm font-medium border border-emerald-500/20 dark:border-emerald-400/30 mb-4 backdrop-blur-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent font-semibold">Trusted by 10,000+ professionals</span>
              </div>
              {/* Gradient headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">Find Your Next</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">Opportunity</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                Browse thousands of verified job listings from South Africa's top employers. Build your verified profile for faster applications.
              </p>
            </div>
            {/* Glowing CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/start"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <span className="relative flex items-center gap-2">
                  Create Free Profile
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-emerald-600 dark:text-emerald-400 font-semibold border-2 border-emerald-500/30 dark:border-emerald-400/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
          {/* Check items with gradient icons */}
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

      {/* Main Content - 3 Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - FilterSidebar + Profile on lg+ */}
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
            {/* Section Header */}
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

            {/* Opportunity Type Filter - NEW SUBHEADER */}
            <OpportunityTypeFilter
              selectedCategory={selectedCategory}
              selectedTypes={selectedTypes}
              onCategoryChange={setSelectedCategory}
              onTypeChange={setSelectedTypes}
              className="mb-4"
            />

            {/* Job Search Section - Main Feed Content */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
              {/* Gradient accent at top */}
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

          {/* Right Sidebar - Featured Sections + Profile on xl+ */}
          <div className="hidden xl:block flex-shrink-0 w-80 space-y-6">
            <FeaturedSections />
            <HomeRightSidebar />
          </div>
        </div>

        {/* Mobile Sidebars - Visible only on smaller screens */}
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

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black dark:from-gray-950 dark:via-black dark:to-black text-gray-400 py-12 mt-8 overflow-hidden">
        {/* Gradient accent at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Security</Link></li>
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
