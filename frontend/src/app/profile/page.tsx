"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useProfile, useProfileActions } from "@/hooks/useProfile";
import profileService from "@/services/profileService";
import { toast } from "@/lib/toast";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileModeToggle } from "@/components/profile/ProfileModeToggle";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Bookmark,
  MessageCircle,
  Edit3,
  ExternalLink,
  Shield,
  CheckCircle,
  Clock,
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight,
  Users
} from "lucide-react";
import { CollaboratorsList } from "@/components/profile/CollaboratorsList";
import { AddCollaboratorModal } from "@/components/profile/AddCollaboratorModal";

import { ProfileFAB } from "@/components/ui/FloatingActionButton";
import { FadeIn } from "@/components/ui/PageTransition";
import { ShareProfileModal } from "@/components/profile/ShareProfileModal";
import { ExperienceSection } from "@/components/profile/ExperienceSection";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { useExperiences } from "@/hooks/useExperience";
import { usePortfolio } from "@/hooks/usePortfolio";
import { SkillsSection } from "@/components/profile/SkillsSection";
import { Footer } from "@/components/layout/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile({ enabled: Boolean(user) });
  const { invalidateProfile } = useProfileActions();
  const { experiences, invalidateExperiences } = useExperiences();
  const { portfolio, invalidatePortfolio } = usePortfolio();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [loading, user, router]);

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleUpdateProfile = async (data: any) => {
    if (!profile) return;
    try {
      await profileService.updateProfile(profile.id, data);
      await invalidateProfile();
      toast.success("Profile updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Calculate profile completeness
  const completenessScore = profile.completeness_score || 30;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          {/* Header - Jobs Style */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-8 h-8 text-emerald-600" />
                Your Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your professional identity and credentials
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/settings?tab=profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                href="/verification"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
              >
                <Shield className="w-4 h-4" />
                Verification
              </Link>
              <Link
                href={`/p/${user.username}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <ExternalLink className="w-4 h-4" />
                Public Profile
              </Link>
            </div>
          </div>

          {/* Mode Toggle */}
          {user.username && (
            <ProfileModeToggle currentMode="edit" username={user.username} />
          )}
          {/* Profile Header Card - Matches public profile style */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <button
                  onClick={() => router.push("/settings?tab=profile")}
                  className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {user.full_name || "Your Name"}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">@{user.username || "username"}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/share"
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Share
                    </Link>
                    <Link
                      href="/settings?tab=profile"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Link>
                  </div>
                </div>

                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  {profile.headline || "Add a headline to describe yourself"}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {user.industry && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {user.industry}
                    </div>
                  )}
                  {user.username && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      proofile.co/p/{user.username}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">About</h2>
                  <button
                    onClick={() => router.push("/settings?tab=profile")}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {profile.summary || "Add a summary to tell others about yourself..."}
                </p>
              </div>

              {/* Experience Section */}
              <ExperienceSection
                experiences={experiences}
                onRefresh={invalidateExperiences}
              />

              {/* Portfolio Section */}
              <PortfolioSection
                items={portfolio}
                onRefresh={invalidatePortfolio}
              />

              {/* Collaborations Section */}
              {user && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Verified Work Graph
                    </h2>
                    <button
                      onClick={() => setIsCollaboratorModalOpen(true)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                    >
                      + Add Collaborator
                    </button>
                  </div>
                  <CollaboratorsList userId={user.id} isOwnProfile={true} />
                </>
              )}

              {/* Skills Section */}
              <SkillsSection
                skills={profile.skills_data || []}
                isOwnProfile={true}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Completeness */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Profile Completeness</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${completenessScore * 2.26} 226`}
                        strokeLinecap="round"
                        className="text-emerald-600"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white">
                      {completenessScore}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {completenessScore < 50
                        ? "Complete your profile to stand out"
                        : completenessScore < 80
                          ? "Great progress! Keep going"
                          : "Your profile looks great!"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings?tab=profile"
                  className="block text-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Complete your profile →
                </Link>
              </div>

              {/* Verification Status */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Verification
                  </h3>
                  <Link href="/verification" className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                    Manage
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleShare}
                    className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Share Profile
                  </button>
                  <Link
                    href={`/p/${user.username}`}
                    className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    Preview as Public
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      <AddCollaboratorModal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        onSuccess={() => {
          // We might want to refresh the list here, but list refreshes itself on mount
          // Ideally pass a refresh trigger to list
        }}
      />

      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        username={user.username || ""}
        fullName={user.full_name || undefined}
        headline={profile.headline}
      />

      {/* Mobile FAB */}
      <ProfileFAB onShare={handleShare} />

      <Footer />
    </>
  );
}
