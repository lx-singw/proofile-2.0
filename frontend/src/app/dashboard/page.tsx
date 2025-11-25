"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Upload, PenTool, Download, Share2, ChevronRight, Sparkles } from "lucide-react";
import PersonaSelector from "@/components/dashboard/PersonaSelector";
import OnboardingWizard, { type OnboardingData } from "@/components/dashboard/OnboardingWizard";
import type { PersonaType } from "@/components/dashboard/PersonaSelector";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  // Derived state - no need for useEffect to control visibility
  const hasPersona = Boolean(user?.persona);
  // Fix: Recruiter persona doesn't require industry
  const isOnboarded = Boolean(
    user?.experience_level &&
    user?.primary_goal &&
    (user?.industry || user?.persona === 'recruiter')
  );

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
      // The re-render will catch isOnboarded and show the dashboard
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

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
  // Determine welcome message
  const isNewUser = user?.created_at && (Date.now() - new Date(user.created_at).getTime() < 5 * 60 * 1000);
  const welcomeMessage = user?.full_name
    ? (isNewUser ? `Welcome, ${user.full_name.split(' ')[0]}!` : `Welcome back, ${user.full_name.split(' ')[0]}!`)
    : (isNewUser ? 'Welcome!' : 'Welcome back!');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <DashboardHeader />
      <main className="flex-1" role="main">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 space-y-8">
          <h1 className="sr-only">Dashboard</h1>

          {/* Welcome Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl p-8 sm:p-12 mb-12 border border-green-200 dark:border-green-800 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/20 to-green-400/20 rounded-full blur-3xl"></div>
            <div className="relative text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {welcomeMessage}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Let's build your verified resume and showcase your skills to the world.
              </p>
            </div>
          </div>

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Upload Resume Card */}
            <button
              onClick={() => router.push("/resume/upload")}
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-green-600 dark:hover:border-green-500 transition-all hover:shadow-2xl hover:scale-105"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Upload Resume
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Upload your existing resume for AI-powered refinement
                </p>
                <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-xs rounded-full">
                    AI Refined
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>

            {/* Build from Scratch Card */}
            <button
              onClick={() => router.push("/resume/build")}
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-purple-600 dark:hover:border-purple-500 transition-all hover:shadow-2xl hover:scale-105"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Build from Scratch
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create a professional resume with our guided builder
                </p>
                <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                  <span>Start building</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/resume/download")}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Download as PDF
                </span>
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
              >
                <Share2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Share Your Profile
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
