"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    opportunityService,
    type OpportunityRecommendation,
} from "@/services/opportunityService";
import {
    AlertCircle,
    BarChart2,
    Bookmark,
    Briefcase,
    GraduationCap,
    Sparkles,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AgentStatusWidget from "@/components/opportunities/agents/AgentStatusWidget";
import HunterLogStream from "@/components/opportunities/agents/HunterLogStream";
import { OpportunityCard } from "@/components/opportunities/cards/OpportunityCard";
import SalaryRangeSlider from "@/components/opportunities/filters/SalaryRangeSlider";
import SmartFilterBar from "@/components/opportunities/filters/SmartFilterBar";
import VerifiedToggle from "@/components/opportunities/filters/VerifiedToggle";
import QuickApplyModal from "@/components/opportunities/modals/QuickApplyModal";

import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { Footer } from "@/components/layout/Footer";
import { JobsFAB } from "@/components/ui/FloatingActionButton";
import { FadeIn } from "@/components/ui/PageTransition";
import axios from "axios";

// Category tab type
type CategoryTab = "all" | "jobs" | "training_skills_programs";

export default function OpportunitiesSearchPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<
    OpportunityRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  // Category Tab State
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("all");

  // Filter States
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    50000, 300000,
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Apply Modal
  const [quickApplyOpportunity, setQuickApplyOpportunity] = useState<{
    id: number;
    title: string;
    company: string;
    score: number;
  } | null>(null);

  // AI Agent States
  const [agents] = useState([
    {
      name: "hunter" as const,
      status: "active" as const,
      message: `Scanning ${recommendations.length} opportunities`,
    },
    {
      name: "tailor" as const,
      status: "idle" as const,
      message: "Ready to customize",
    },
    {
      name: "negotiator" as const,
      status: "paused" as const,
      message: "Premium feature",
    },
  ]);

  const [showAuthGate, setShowAuthGate] = useState(false);

  // Redirect to login if not authenticated - Disabled for Preview-to-Premium flow
  useEffect(() => {
    // if (!authLoading && !user) {
    //     router.push('/login?redirect=/opportunities');
    // }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user) return;

      try {
        setError(null);
        const data = await opportunityService.getAdvancedRecommendations();
        setRecommendations(data);
      } catch (err) {
        let errorMessage = "Failed to load opportunity recommendations";
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            errorMessage = "Please log in to see recommendations";
          } else if (err.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          }
        }
        setError(errorMessage);
        console.error(
          "Failed to fetch recommendations:",
          err instanceof Error ? err.message : err,
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOpportunities();
    }
  }, [user]);

  // Filter recommendations by category
  const filteredRecommendations = recommendations.filter((r) => {
    if (categoryTab === "all") return true;
    return r.opportunity?.category === categoryTab;
  });

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) return null;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-emerald-600" />
                Advanced Search
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                AI-matched opportunities for your career
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <Briefcase className="w-4 h-4" />
                Browse Feed
              </Link>
              <Link
                href="/opportunities/saved"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </Link>
              <Link
                href="/opportunities/agents"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4" />
                AI Agents
              </Link>
              <Link
                href="/opportunities/market"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
              >
                <BarChart2 className="w-4 h-4" />
                Market Intel
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCategoryTab("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                categoryTab === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryTab("jobs")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                categoryTab === "jobs"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Jobs
            </button>
            <button
              onClick={() => setCategoryTab("training_skills_programs")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                categoryTab === "training_skills_programs"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Training & Skills
            </button>
          </div>

          {/* Smart Filter Bar */}
          <div className="mb-6">
            <SmartFilterBar onFilter={(query) => setSearchQuery(query)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Verified Toggle */}
              <VerifiedToggle
                enabled={verifiedOnly}
                onChange={setVerifiedOnly}
              />

              {/* Salary Range */}
              <SalaryRangeSlider
                min={50000}
                max={300000}
                value={salaryRange}
                onChange={setSalaryRange}
              />

              {/* AI Agents Status */}
              <AgentStatusWidget agents={agents} />

              {/* Hunter Log Stream */}
              <HunterLogStream isLive={true} />
            </div>

            {/* Job List */}
            <div className="lg:col-span-3 space-y-4">
              {loading ? (
                // Loading Skeletons
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
                    <div className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
                  </div>
                ))
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    No matches found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Try updating your profile skills or headline to get better
                    recommendations.
                  </p>
                </div>
              ) : (
                <>
                  {filteredRecommendations.map((rec, i) => (
                    <OpportunityCard
                      key={rec.opportunity.id}
                      rec={rec}
                      index={i}
                      isAuthenticated={!!user}
                      onAuthGate={() => setShowAuthGate(true)}
                      onQuickApply={(id, title, company, score) =>
                        setQuickApplyOpportunity({ id, title, company, score })
                      }
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Quick Apply Modal */}
          {quickApplyOpportunity && (
            <QuickApplyModal
              isOpen={!!quickApplyOpportunity}
              onClose={() => setQuickApplyOpportunity(null)}
              onSubmit={() => {
                console.log("Applied to:", quickApplyOpportunity);
                setQuickApplyOpportunity(null);
              }}
              job={{
                title: quickApplyOpportunity.title,
                company: quickApplyOpportunity.company,
                matchScore: quickApplyOpportunity.score,
              }}
            />
          )}
        </FadeIn>
      </main>

      {/* Mobile FAB */}
      <JobsFAB
        onQuickApply={() =>
          quickApplyOpportunity && setQuickApplyOpportunity(null)
        }
      />

      {/* Auth Gate Modal */}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        actionType="apply"
        title="Apply to Your Top Matches"
        description="Sign up to use our AI Quick Apply and stand out with your verified Proofile identity."
      />

      <Footer />
    </>
  );
}
