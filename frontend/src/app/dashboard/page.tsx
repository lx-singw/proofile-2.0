"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Upload, PenTool, Download, Share2, ChevronRight, Sparkles,
  Shield, Star, Zap, Flame, TrendingUp, Trophy, Building2,
  DollarSign, FileText, Briefcase, Target, Award
} from "lucide-react";
import PersonaSelector from "@/components/dashboard/PersonaSelector";
import OnboardingWizard, { type OnboardingData } from "@/components/dashboard/OnboardingWizard";
import type { PersonaType } from "@/components/dashboard/PersonaSelector";
import DashboardHeader from "@/components/layout/DashboardHeader";
import FloatingActionButton from "@/components/dashboard/FloatingActionButton";
import OnboardingTour from "@/components/dashboard/OnboardingTour";
import { statsService, type UserStats } from "@/services/statsService";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import JobRecommendations from "@/components/dashboard/JobRecommendations";
import CustomizationModal from "@/components/dashboard/CustomizationModal";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { Settings2 } from "lucide-react";
import ResumeCard from "@/components/dashboard/ResumeCard";
import { resumeService, type Resume } from "@/services/resumeService";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  const { preferences, toggleSection } = useDashboardPreferences();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // Welcome message state - must be at top level before any conditional returns
  const [showWelcome, setShowWelcome] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const flag = sessionStorage.getItem('justCompletedOnboarding');
      console.log('[Dashboard] Checking welcome flag:', flag);
      if (flag === 'true') {
        console.log('[Dashboard] Setting showWelcome to true');
        setShowWelcome(true);
        sessionStorage.removeItem('justCompletedOnboarding');
      }
    }
  }, [user?.persona, user?.experience_level]); // Re-check when user data changes

  // Derived state - no need for useEffect to control visibility
  const hasPersona = Boolean(user?.persona);
  // Fix: Recruiter persona doesn't require industry
  const isOnboarded = Boolean(
    user?.experience_level &&
    user?.primary_goal &&
    (user?.industry || user?.persona === 'recruiter')
  );

  // Fetch user stats
  useEffect(() => {
    if (user && isOnboarded) {
      statsService.getUserStats()
        .then(setStats)
        .catch(err => console.error('Failed to fetch stats:', {
          message: err?.message || 'Unknown error',
          detail: err?.detail || err?.error || 'No details',
          status: err?.status,
          full: err
        }))
        .finally(() => setStatsLoading(false));
    }
  }, [user, isOnboarded]);

  console.log("[Dashboard] Render state:", {
    hasPersona,
    isOnboarded,
    persona: user?.persona,
    experience: user?.experience_level,
    goal: user?.primary_goal,
    industry: user?.industry
  });

  // Handle persona selection
  const handlePersonaSelect = async (persona: PersonaType) => {
    console.log("[Dashboard] handlePersonaSelect called with:", persona);
    try {
      // Optimistically update local state if needed, or just wait for updateUser
      await updateUser({ persona });
      // The re-render will catch !isOnboarded && hasPersona and show the wizard
    } catch (error) {
      console.error("Failed to update persona:", error);
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    console.log("[Dashboard] handleOnboardingComplete called with:", data);
    try {
      await updateUser(data);
      // Set flag to show "Welcome" instead of "Welcome back"
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('justCompletedOnboarding', 'true');
      }
      // The re-render will catch isOnboarded and show the dashboard
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  // Fetch resumes
  useEffect(() => {
    if (user && isOnboarded) {
      resumeService.list()
        .then(setResumes)
        .catch(err => console.error('Failed to fetch resumes:', err))
        .finally(() => setResumesLoading(false));
    }
  }, [user, isOnboarded]);

  // Handle resume export
  const handleResumeExport = async (id: string) => {
    try {
      const blob = await resumeService.exportPDF(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle resume delete
  const handleResumeDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeService.delete(id);
      setResumes(resumes.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg" aria-live="polite">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p data-testid="unauthenticated-message" aria-live="polite">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // 1. New User Flow: No Persona -> Persona Selector
  if (!hasPersona) {
    return <PersonaSelector onSelect={handlePersonaSelect} />;
  }

  // 2. Incomplete Onboarding: Has Persona but not fully onboarded -> Wizard
  if (!isOnboarded) {
    // We know user.persona exists here because of the check above
    return <OnboardingWizard persona={user.persona!} onComplete={handleOnboardingComplete} />;
  }

  // 3. Returning User: Fully onboarded -> Dashboard
  const welcomeMessage = user?.full_name
    ? (showWelcome ? `Welcome, ${user.full_name.split(' ')[0]}!` : `Welcome back, ${user.full_name.split(' ')[0]}!`)
    : (showWelcome ? 'Welcome!' : 'Welcome back!');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <DashboardHeader />
      <main className="flex-1" role="main">
        <div className="w-full px-6 py-8 space-y-8">
          <h1 className="sr-only">Dashboard</h1>

          {/* Welcome Header */}
          <div data-tour="welcome" className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl p-8 sm:p-12 border border-green-200 dark:border-green-800 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/20 to-green-400/20 rounded-full blur-3xl"></div>
            <div className="relative text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {welcomeMessage}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Build your verified resume, showcase skills, and discover opportunities.
              </p>
            </div>
          </div>

          {/* Customization Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsCustomizationOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-sm hover:shadow-md"
            >
              <Settings2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Customize Dashboard</span>
            </button>
          </div>

          {/* Main Action Cards - Resume Building */}
          {preferences.visibleSections.resumeTools && (
            <div className="space-y-4" data-tour="resume-tools">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Resume Tools
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Upload Resume Card */}
                <button
                  onClick={() => router.push("/resume/upload")}
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-green-600 dark:hover:border-green-500 transition-all hover:shadow-2xl hover:scale-105"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Upload Resume
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Upload your existing resume for AI-powered refinement
                    </p>
                    <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-xs rounded-full">
                        AI Refined
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Build from Scratch Card */}
                <button
                  onClick={() => router.push("/resume/build")}
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-purple-600 dark:hover:border-purple-500 transition-all hover:shadow-2xl hover:scale-105"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <PenTool className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Build from Scratch
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Create a professional resume with our guided builder
                    </p>
                    <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                      <span>Start building</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* AI Build Card */}
                <button
                  onClick={() => router.push("/resume/ai-build")}
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-blue-600 dark:hover:border-blue-500 transition-all hover:shadow-2xl hover:scale-105"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      AI Build from Profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Let AI create a polished resume using your profile data
                    </p>
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-xs rounded-full">
                        ✨ AI Powered
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
                {/* My Resumes Card */}
                <button
                  onClick={() => router.push("/resume")}
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-blue-600 dark:hover:border-blue-500 transition-all hover:shadow-2xl hover:scale-105"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      My Resumes
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      View and manage your {resumes.length > 0 ? `${resumes.length} existing` : 'existing'} resumes
                    </p>
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      <span>View all</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Profile & Verification Section */}
          {preferences.visibleSections.profileVerification && (
            <div className="space-y-4" data-tour="profile-verification">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Profile & Verification
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">My Profile</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Share & manage</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                </button>

                <button
                  onClick={() => router.push("/verification")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Verification</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Verify skills</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => router.push("/ratings")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Peer Ratings</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Get endorsed</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
                </button>

                <button
                  onClick={() => router.push("/skills/leaderboard")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Leaderboard</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Top skills</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                </button>

                <button
                  onClick={() => router.push("/resume/download")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Download Resume</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Export as PDF</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Job Discovery Section */}
          {preferences.visibleSections.jobDiscovery && (
            <div className="space-y-4" data-tour="job-discovery">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-orange-600" />
                Discover Opportunities
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push("/ai-matching")}
                  className="flex items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-base">AI Job Matching</div>
                    <div className="text-sm text-purple-100">Personalized recommendations</div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => router.push("/jobs/trending")}
                  className="flex items-center gap-3 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Trending Jobs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hot opportunities</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                </button>

                <button
                  onClick={() => router.push("/companies/hiring")}
                  className="flex items-center gap-3 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Companies Hiring</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active recruiters</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => router.push("/jobs/saved")}
                  className="flex items-center gap-3 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Saved Jobs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Your bookmarks</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                </button>

                <button
                  onClick={() => router.push("/salary/insights")}
                  className="flex items-center gap-3 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Salary Insights</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Market data</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                </button>

                <button
                  onClick={() => router.push("/activity/live")}
                  className="flex items-center gap-3 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Live Activity</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Real-time updates</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                </button>
              </div>

              {/* Recommended Jobs */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Recommended for You
                </h3>
                <JobRecommendations />
              </div>
            </div>
          )}

          {/* Stats Overview */}
          {preferences.visibleSections.stats && (
            <div className="grid md:grid-cols-3 gap-6" data-tour="stats">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.resumes_count || 0}
                  </span>
                </div>
                <div className="text-sm opacity-90">Resumes Created</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.verifications_count || 0}
                  </span>
                </div>
                <div className="text-sm opacity-90">Verifications</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {statsLoading ? '...' : stats?.ratings_count || 0}
                  </span>
                </div>
                <div className="text-sm opacity-90">Peer Ratings</div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {preferences.visibleSections.recentActivity && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-teal-600" />
                Recent Activity
              </h2>
              <ActivityFeed />
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div data-tour="fab">
        <FloatingActionButton />
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        preferences={preferences}
        onToggleSection={toggleSection}
      />
    </div>
  );
}
