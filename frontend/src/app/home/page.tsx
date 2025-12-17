"use client";

import Link from "next/link";
import { CheckCircle, Shield, Star, Zap, ArrowRight, ChevronDown, Briefcase } from "lucide-react";
import { useState } from "react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import JobSearchSection from "@/components/portal/JobSearchSection";
import HomeLeftSidebar from "@/components/home/HomeLeftSidebar";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import FeaturedSections from "@/components/portal/FeaturedSections";
import { OpportunityTypeFilter, OpportunityCategory, OpportunityType } from "@/components/opportunities/OpportunityTypeFilter";

export default function HomePage() {
  const [productOpen, setProductOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Opportunity filter state
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory>(null);
  const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
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

      {/* Inclusive Banner */}
      <section className="bg-green-600 dark:bg-green-700 py-3 border-b border-green-700 dark:border-green-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm sm:text-base text-white font-medium">
            For <span className="font-bold">students</span>, <span className="font-bold">graduates</span>, <span className="font-bold">apprentices</span>, <span className="font-bold">professionals</span>, <span className="font-bold">job seekers</span>, <span className="font-bold">career changers</span>, <span className="font-bold">remote workers</span>, <span className="font-bold">freelancers</span>, <span className="font-bold">recruiters</span>, and <span className="font-bold">everyone</span> building their future — Proofile is your platform.
          </p>
        </div>
      </section>

      {/* Hero Section - Condensed */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 py-8 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full text-sm font-medium text-green-700 dark:text-green-300 mb-3">
                <Star className="w-4 h-4" />
                Trusted by 10,000+ professionals
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Find Your Next Opportunity
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                Browse thousands of verified job listings from South Africa's top employers. Build your verified profile for faster applications.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/start" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl">
                Create Free Profile
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-green-600 dark:text-green-400 font-medium border border-green-600 dark:border-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 hover:scale-[1.02]">
                Sign in
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400 mt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Free to browse</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>No commitment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Get verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - 3 Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:block flex-shrink-0">
            <HomeLeftSidebar />
          </div>

          {/* Center Column - Job Listings */}
          <div className="flex-1 min-w-0">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Opportunities</h2>
              </div>
              <Link href="/portal" className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
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
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 border border-gray-200 dark:border-gray-700">
              <JobSearchSection
                maxJobs={12}
                showFilters={true}
                className="py-4"
                opportunityCategory={selectedCategory}
                opportunityTypes={selectedTypes}
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
      <footer className="bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-950 text-gray-400 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-200 hover:scale-[1.02]">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
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
