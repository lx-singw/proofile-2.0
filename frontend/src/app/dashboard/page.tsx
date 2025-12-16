"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile"; // New import
import {
  Upload, PenTool, Download, Share2, ChevronRight, Sparkles,
  Shield, Star, Zap, Flame, TrendingUp, Trophy, Building2,
  DollarSign, FileText, Briefcase, Target, Award
} from "lucide-react";
import PersonaSelector from "@/components/dashboard/PersonaSelector";
import OnboardingWizard, { type OnboardingData } from "@/components/dashboard/OnboardingWizard";
import type { PersonaType } from "@/components/dashboard/PersonaSelector";

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
import AIInsightsCard from "@/components/dashboard/AIInsightsCard";
import NextStepPrompt from "@/components/dashboard/NextStepPrompt";
import { CompletenessWidget } from "@/components/profile/CompletenessWidget"; // New import
import ResumeToolsMenu from "@/components/dashboard/ResumeToolsMenu";
import VerificationSection from "@/components/dashboard/VerificationSection";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useProfile({
    enabled: !!user
  });

  const loading = authLoading || (!!user && profileLoading);

  const { preferences, toggleSection } = useDashboardPreferences();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // Welcome message state
  const [showWelcome, setShowWelcome] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const flag = sessionStorage.getItem('justCompletedOnboarding');
      if (flag === 'true') {
        setShowWelcome(true);
        sessionStorage.removeItem('justCompletedOnboarding');
      }
    }
  }, [user?.persona, user?.experience_level]);

  // Derived state
  const hasPersona = Boolean(user?.persona);
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
        .catch(err => console.error('Failed to fetch stats:', err))
        .finally(() => setStatsLoading(false));
    }
  }, [user, isOnboarded]);

  // Handle persona selection
  const handlePersonaSelect = async (persona: PersonaType) => {
    try {
      await updateUser({ persona });
    } catch (error) {
      console.error("Failed to update persona:", error);
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      await updateUser(data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('justCompletedOnboarding', 'true');
      }
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

  // 1. New User Flow: No Persona
  if (!hasPersona) {
    return <PersonaSelector onSelect={handlePersonaSelect} />;
  }

  // 2. Incomplete Onboarding
  if (!isOnboarded) {
    return <OnboardingWizard persona={user.persona!} onComplete={handleOnboardingComplete} />;
  }

  // 3. Returning User: Fully onboarded
  const welcomeMessage = user?.full_name
    ? (showWelcome ? `Welcome, ${user.full_name.split(' ')[0]}!` : `Welcome back, ${user.full_name.split(' ')[0]}!`)
    : (showWelcome ? 'Welcome!' : 'Welcome back!');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      
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

          {/* Next Step Prompt */}
          <div className="max-w-2xl mx-auto">
            <NextStepPrompt
              profileComplete={Boolean(stats?.verifications_count && stats.ratings_count)}
              hasResume={(stats?.resumes_count || 0) > 0}
              isVerified={(stats?.verifications_count || 0) > 0}
              hasRatings={(stats?.ratings_count || 0) > 0}
              userName={user?.full_name?.split(' ')[0]}
            />
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

          {/* Resume Tools - Collapsed by default */}
          {preferences.visibleSections.resumeTools && (
            <div data-tour="resume-tools">
              <ResumeToolsMenu />
            </div>
          )}

          {/* Profile & Verification */}
          {preferences.visibleSections.profileVerification && (
            <div className="space-y-4" data-tour="profile-verification">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Profile & Verification
              </h2>

              {/* Trust Score & Verification Section */}
              <VerificationSection />

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => router.push("/profile")} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">My Profile</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Share & manage</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                </button>
                {/* ... other verification buttons ... */}
                <button onClick={() => router.push("/verification")} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Verification</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Verify skills</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </button>
                <button onClick={() => router.push("/ratings")} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Peer Ratings</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Get endorsed</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
                </button>
                <button onClick={() => router.push("/skills/leaderboard")} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Leaderboard</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Top skills</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                </button>
              </div>
            </div>
          )}

          {/* Job Discovery */}
          {preferences.visibleSections.jobDiscovery && (
            <div className="space-y-4" data-tour="job-discovery">
              {/* ... Job discovery buttons ... */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ... buttons ... */}
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
                  <span className="text-3xl font-bold">{statsLoading ? '...' : stats?.resumes_count || 0}</span>
                </div>
                <div className="text-sm opacity-90">Resumes Created</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{statsLoading ? '...' : stats?.verifications_count || 0}</span>
                </div>
                <div className="text-sm opacity-90">Verifications</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{statsLoading ? '...' : stats?.ratings_count || 0}</span>
                </div>
                <div className="text-sm opacity-90">Peer Ratings</div>
              </div>
            </div>
          )}

          {/* AI Insights & Profile Widget */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <AIInsightsCard
                userName={user?.full_name?.split(' ')[0] || user?.username || 'there'}
                profileCompleteness={profile?.completeness_score || 0}
              />
            </div>
            <div className="space-y-4">
              {/* Profile Completeness Widget */}
              {profile && <CompletenessWidget profile={profile} />}

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Job Match Stats
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Strong Matches</span>
                    <span className="font-bold text-green-600">12 jobs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Profile Views</span>
                    <span className="font-bold text-gray-900 dark:text-white">48 this week</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Recruiter Interest</span>
                    <span className="font-bold text-purple-600">8 active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

      <div data-tour="fab">
        <FloatingActionButton />
      </div>

      <OnboardingTour />
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        preferences={preferences}
        onToggleSection={toggleSection}
      />
    </div>
  );
}
