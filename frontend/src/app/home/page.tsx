"use client";

import Link from "next/link";
import { CheckCircle, Star, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { useReputationScores } from "@/hooks/useReputationScores";

// Components
import FeaturedSections from "@/components/portal/FeaturedSections";
import { Footer } from "@/components/layout/Footer";
import { UserProfileCard } from "@/components/home/UserProfileCard";
import HomeLeftSidebar from "@/components/home/HomeLeftSidebar";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import FilterSidebar from "@/components/portal/FilterSidebar";
import portalService from "@/services/portalService";
import { OpportunityTypeFilter, OpportunityCategory, OpportunityType } from "@/components/opportunities/OpportunityTypeFilter";
import { OpportunityFeed } from "@/components/home/OpportunityFeed";
import { UpgradePrompt, UpgradePromptVariant } from "@/components/home/feed/UpgradePrompt";
import { ProofileScoreBadge } from "@/components/home/feed/ProofileScoreBadge";
import type { UserFeedState, OpportunityFeedCard } from "@/types/feedCard";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // Reputation for userFeedState derivation (safe to call always — hook guards internally)
  const { reputation } = useReputationScores();
  const userFeedState: UserFeedState = !isLoggedIn
    ? 'anonymous'
    : (reputation?.total_reviews ?? 0) > 0
    ? 'verified'
    : 'profile';

  // Opportunity filter state (for guest view)
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory>(null);
  const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>([]);

  // Upgrade prompt state (Phase C)
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptVariant | null>(null);
  const handleAnonymousSave = useCallback((_card: OpportunityFeedCard) => {
    setUpgradePrompt('save_prompt');
  }, []);
  const handleUnverifiedInterest = useCallback((_card: OpportunityFeedCard) => {
    setUpgradePrompt('interest_prompt');
  }, []);
  const handleNetworkPrompt = useCallback(() => {
    setUpgradePrompt('network_prompt');
  }, []);

  // Session signal persistence — when user logs in, pass stored signals as
  // sessionSeed to the feed so ranking can use them. Clear after merge.
  const [sessionSeed, setSessionSeed] = useState<import('@/types/feedCard').InferredProfile | undefined>(undefined);
  const prevLoggedInUserId = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const userId = String(user.id ?? '');
    // Only run once per login event
    if (prevLoggedInUserId.current === userId) return;
    prevLoggedInUserId.current = userId;

    // Read accumulated anonymous signals and derive a seed profile
    try {
      const rawSignals = localStorage.getItem('pf_session_signals');
      const rawMeta = localStorage.getItem('pf_session_card_meta');
      if (rawSignals && rawMeta) {
        const signals: import('@/types/feedCard').SignalEvent[] = JSON.parse(rawSignals);
        const meta: Record<string, { roleTitle: string; location: string; skills: string[] }> = JSON.parse(rawMeta);
        const engaged = signals.filter((s) => s.signalType === 'dwell_3s' || s.signalType === 'dwell_10s');
        if (engaged.length >= 3) {
          const first = meta[engaged[0].cardId];
          if (first) {
            setSessionSeed({
              role: first.roleTitle,
              location: first.location,
              industry: '',
              salaryMin: 0,
              salaryMax: 0,
              salaryCurrency: 'ZAR',
              skills: first.skills ?? [],
              confirmedByUser: false,
            });
          }
        }
        // Clear anonymous data after merging
        localStorage.removeItem('pf_session_signals');
        localStorage.removeItem('pf_session_card_meta');
        sessionStorage.removeItem('pf_session_id');
      }
    } catch {
      // ignore localStorage errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
  void combinedOpportunityTypes; // kept for future portal/filter integration
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Upgrade prompts — portal over the entire page */}
      {upgradePrompt && (
        <UpgradePrompt
          variant={upgradePrompt}
          currentScore={reputation?.global_score ?? 50}
          onDismiss={() => setUpgradePrompt(null)}
        />
      )}

      {/* Hero Section (Gradient Banner) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 dark:from-emerald-700 dark:via-teal-800 dark:to-green-900 text-white py-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 animate-gradient-x" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm sm:text-base text-white font-medium drop-shadow-sm">
            For <span className="font-bold">students</span>, <span className="font-bold">graduates</span>, <span className="font-bold">professionals</span>, <span className="font-bold">job seekers</span>, <span className="font-bold">freelancers</span>, and <span className="font-bold">everyone</span> building their future — Proofile is your platform.
          </p>
        </div>
      </div>

      {/* ========================================= */}
      {/* LOGGED-IN VIEW: Professional Feed */}
      {/* ========================================= */}
      {isLoggedIn ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - User Profile + Tools */}
            <div className="hidden lg:block flex-shrink-0 w-72 space-y-4">
              <UserProfileCard />
              <HomeLeftSidebar />
            </div>

            {/* Center Column — unified opportunity feed */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Proofile Score badge — shown for logged-in users with any reputation data */}
              {reputation && (
                <ProofileScoreBadge
                  score={reputation.global_score}
                  totalReviews={reputation.total_reviews}
                />
              )}
              <OpportunityTypeFilter
                selectedCategory={selectedCategory}
                selectedTypes={selectedTypes}
                onCategoryChange={setSelectedCategory}
                onTypeChange={setSelectedTypes}
              />
              <OpportunityFeed
                userFeedState={userFeedState}
                userId={user?.id ? String(user.id) : null}
                sessionSeed={sessionSeed}
                onUnverifiedInterest={handleUnverifiedInterest}
                onNetworkPrompt={handleNetworkPrompt}
                sidebarFilters={{
                  location: sidebarFilters.location,
                  industry: sidebarFilters.category,
                }}
              />
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
        </div>
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
                    Browse thousands of verified opportunities from South Africa's top employers. Build your verified profile for faster applications.
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

              {/* Center Column — unified opportunity feed */}
              <div className="flex-1 min-w-0 space-y-4">
                <OpportunityTypeFilter
                  selectedCategory={selectedCategory}
                  selectedTypes={selectedTypes}
                  onCategoryChange={setSelectedCategory}
                  onTypeChange={setSelectedTypes}
                />
                <OpportunityFeed
                  userFeedState="anonymous"
                  sidebarFilters={{
                    location: sidebarFilters.location,
                    industry: sidebarFilters.category,
                  }}
                  onAnonymousSave={handleAnonymousSave}
                  onNetworkPrompt={handleNetworkPrompt}
                />
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
          </div>

          {/* Verification Value Prop Section */}
          <section id="verification" className="relative py-20 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 blur-[120px] rounded-full translate-x-1/2" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" />
                    Multi-Layer Verification
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    Beyond the Resume. <br />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Proven Identity.</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Proofile verifies your core professional credentials at the source. From email and phone to employment history and certifications, we build a trust layer that employers can rely on instantly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {[
                      { title: "Direct Verification", desc: "Automated checks with institutions" },
                      { title: "Immutable Record", desc: "Tamper-proof professional history" },
                      { title: "Trust Score", desc: "Dynamic score based on verified data" },
                      { title: "Enhanced Visibility", desc: "Verified users get 3x more views" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex-shrink-0 w-5 h-5 mt-1 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
                    <CheckCircle className="w-24 h-24 mb-6 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-2 uppercase tracking-widest">Verified</h3>
                    <p className="text-emerald-50 font-medium">98.5% Trust Accuracy Score</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ratings Value Prop Section */}
          <section id="ratings" className="relative py-20 bg-slate-50 dark:bg-gray-800/50 overflow-hidden border-y border-gray-200/50 dark:border-gray-700/50">
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-teal-500/5 blur-[120px] rounded-full -translate-x-1/2" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-400 font-semibold text-sm border border-teal-500/20">
                    <Star className="w-4 h-4 fill-current" />
                    Professional Reputation
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    Peer Endorsements That <br />
                    <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Actually Matter.</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Static skills lists are a thing of the past. Proofile allows your managers, colleagues, and clients to provide verified ratings and endorsements on your specific contributions.
                  </p>
                  <Link href="/start" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-all">
                    Start Building Reputation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: "Technical Proficiency", score: 4.8 },
                    { label: "Collaboration", score: 4.9 },
                    { label: "Problem Solving", score: 4.7 },
                    { label: "Reliability", score: 5.0 }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                        <Star className={`w-6 h-6 text-teal-500 ${i % 2 === 0 ? 'fill-teal-500' : ''}`} />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1">{item.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{item.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <Footer />
    </>
  );
}
