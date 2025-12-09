"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { SocialActionButton } from "@/components/social/SocialActions";
import {
  Share2,
  Download,
  QrCode,
  Star,
  Eye,
  UserPlus,
  ThumbsUp,
  MessageCircle,
  Coffee,
  Bookmark,
  Edit3,
} from "lucide-react";
import { toast } from "@/lib/toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile({ enabled: Boolean(user) });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [ratingCount, setRatingCount] = useState(12);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !profileLoading && !profile) {
      router.replace("/profile/create");
    }
  }, [loading, user, profile, profileLoading, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" data-testid="profile-loading">
        <p className="text-muted-foreground">Loading your professional identity...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/p/${user.username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${user.full_name}'s Proofile`,
          text: profile.headline,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Profile URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleDownloadResume = () => {
    toast.success("Resume download initiated!");
    // Implementation for download
  };

  const handleShowQR = () => {
    toast.success("QR code modal coming soon!");
    // Implementation for QR code modal
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Unfollowed!" : "Following!");
  };

  const handleStar = () => {
    setIsStarred(!isStarred);
    toast.success(isStarred ? "Removed from bookmarks!" : "Added to bookmarks!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <DashboardHeader />

      <main className="flex-1 p-4 sm:p-6 lg:p-8" data-testid="profile-page">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section with Avatar and Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={user.full_name || "Profile"}
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-4 border-blue-100"
                      unoptimized
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100">
                      {user.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {user.full_name}
                    </h1>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 mb-2">{profile.headline}</p>
                  <p className="text-sm text-gray-500">
                    proofile.co/{user.username || "your-username"}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white self-start sm:self-auto"
              >
                <Link href="/profile/edit">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 py-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">234</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Profile Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">45</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Connections</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">4.8</span>
                  <span className="text-yellow-400">⭐</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">({ratingCount} ratings)</div>
              </div>
            </div>

            {/* Verification Progress */}
            <div className="py-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Verification Progress</span>
                <span className="text-sm font-bold text-blue-600">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: "67%" }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-6 border-t border-gray-200">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadResume}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Resume</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShowQR}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <QrCode className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
            </div>
          </div>

          {/* Verified Badges Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Verified Badges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-green-900">Email Verified</p>
                  <p className="text-xs text-green-700">Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-green-900">Phone Verified</p>
                  <p className="text-xs text-green-700">Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-green-900">Stanford University</p>
                  <p className="text-xs text-green-700">Education Verified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-semibold text-yellow-900">TechCorp Employment</p>
                  <p className="text-xs text-yellow-700">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed">
              {profile.summary ||
                "Results-driven Product Manager with 5+ years of experience building and scaling products that users love. Expertise in cross-functional leadership, data-driven decision making, and go-to-market strategy. Passionate about creating positive impact through technology."}
            </p>
          </div>

          {/* Work Experience */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Work Experience</h2>
            <div className="space-y-6">
              <div className="pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Senior Product Manager</h3>
                    <p className="text-gray-600">TechCorp</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">Jan 2021 - Present</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Led product strategy for core platform</li>
                  <li>Increased engagement by 40%</li>
                  <li>Managed team of 12 engineers and designers</li>
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-600">Rated:</span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-900">4.9/5.0</span>
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-xs text-gray-500">(5 colleagues)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Product Management</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">8 endorsements</p>
                <p className="text-xs text-blue-700">Verified through assessment</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Agile/Scrum</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">6 endorsements</p>
                <p className="text-xs text-blue-700">Verified through assessment</p>
              </div>
            </div>
          </div>

          {/* Ratings & Reviews */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Ratings & Reviews</h2>
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900">4.8/5.0</span>
                <span className="text-2xl text-yellow-400">⭐</span>
                <span className="text-sm text-gray-600">({ratingCount} ratings)</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">Technical Skills</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: "98%" }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.9/5.0</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">Communication</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: "94%" }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.7/5.0</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">Reliability</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">5.0/5.0</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">⭐⭐⭐⭐⭐ Sarah Johnson</p>
                    <p className="text-xs text-gray-600">Former Manager @ TechCorp</p>
                  </div>
                  <span className="text-xs text-gray-500">1 week ago</span>
                </div>
                <p className="text-sm text-gray-700">
                  "John is an exceptional PM. Delivered our product 2 weeks ahead of schedule and increased engagement by 40%."
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6 text-gray-700 border-gray-300 hover:bg-gray-50">
              View All {ratingCount} Ratings
            </Button>
          </div>

          {/* Social Interaction Footer */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 sm:p-8">
            <p className="text-center text-gray-600 mb-4 text-sm">
              Interested in connecting? Use the buttons below:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="sm"
                onClick={handleFollow}
                className={`${
                  isFollowing
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button
                size="sm"
                onClick={handleStar}
                className={`${
                  isStarred
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                }`}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                {isStarred ? "Saved" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
