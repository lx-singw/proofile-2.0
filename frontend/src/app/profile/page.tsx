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
  };

  const handleShowQR = () => {
    toast.success("QR code modal coming soon!");
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
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />

      <main className="flex-1" data-testid="profile-page">
        {/* Cover Banner */}
        <div className="h-48 sm:h-56 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto -mt-24 relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={user.full_name || "Profile"}
                    width={140}
                    height={140}
                    className="rounded-xl object-cover border-4 border-white shadow-lg w-32 h-32 sm:w-40 sm:h-40"
                    unoptimized
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                    {user.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>

              {/* Profile Info Section */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                        {user.full_name}
                      </h1>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <span>✓</span> Verified
                      </span>
                    </div>
                    <p className="text-xl text-blue-600 font-semibold mb-1">{profile.headline}</p>
                    <p className="text-sm text-gray-500 mb-2">proofile.co/{user.username || "your-username"}</p>
                    <p className="text-sm text-gray-600">San Francisco, CA • Open to opportunities</p>
                  </div>

                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-6 rounded-lg self-start sm:self-auto"
                  >
                    <Link href="/profile/edit">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-6 py-4 border-t border-b border-gray-200">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">234</div>
                    <div className="text-xs text-gray-500 mt-1">Profile Views</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">45</div>
                    <div className="text-xs text-gray-500 mt-1">Connections</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-900">4.8</span>
                      <span className="text-yellow-400 text-lg">⭐</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">(12 ratings)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Progress */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Verification Progress</span>
                <span className="text-sm font-bold text-blue-600">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full" style={{ width: "67%" }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200 mt-6">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold"
                onClick={handleDownloadResume}
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Resume</span>
              </Button>
              <Button
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold"
                onClick={handleShowQR}
              >
                <QrCode className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
              <div className="flex-1"></div>
              <Button
                size="sm"
                onClick={handleFollow}
                className={`font-semibold ${
                  isFollowing
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed text-base">
                  {profile.summary ||
                    "Results-driven Product Manager with 5+ years of experience building and scaling products."}
                </p>
              </div>

              {/* Experience */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Experience</h2>
                <div className="space-y-6">
                  <div className="flex gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                      TC
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="text-base font-bold text-gray-900">Senior Product Manager</h3>
                          <p className="text-sm text-gray-600">TechCorp • San Francisco</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">✓ Verified</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Jan 2021 - Present</p>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        <li>Led product strategy for core platform</li>
                        <li>Increased engagement by 40%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Skills & Expertise</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: "Product Management", verified: true },
                    { name: "Agile/Scrum", verified: true },
                    { name: "Data Analysis", verified: true },
                    { name: "User Research", verified: false },
                  ].map((skill, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">{skill.name}</h4>
                        {skill.verified && <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Ratings & Reviews</h2>
                <div className="mb-6">
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="text-5xl font-bold text-gray-900">4.8</div>
                      <div className="text-sm text-gray-600">out of 5</div>
                    </div>
                    <div className="flex gap-1 text-yellow-400 text-2xl">★★★★★</div>
                    <div className="flex-1 text-right text-sm text-gray-600">Based on {ratingCount} ratings</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View All Ratings
                </Button>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Verified */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Verified</h3>
                <div className="space-y-3">
                  {[
                    { icon: "✓", label: "Email", status: "verified" },
                    { icon: "✓", label: "Phone", status: "verified" },
                    { icon: "✓", label: "Education", status: "verified" },
                    { icon: "⏳", label: "Employment", status: "pending" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        item.status === "verified" ? "bg-green-50 border border-green-100" : "bg-yellow-50 border border-yellow-100"
                      }`}
                    >
                      <span className={item.status === "verified" ? "text-green-600 text-lg" : "text-yellow-600 text-lg"}>{item.icon}</span>
                      <span className={`text-sm font-semibold ${item.status === "verified" ? "text-green-900" : "text-yellow-900"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connect */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Connect</h3>
                <p className="text-sm text-gray-600 mb-4">Interested in connecting?</p>
                <div className="space-y-2">
                  <Button
                    onClick={handleFollow}
                    className={`w-full font-semibold h-10 ${
                      isFollowing ? "bg-blue-100 hover:bg-blue-200 text-blue-700" : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    onClick={handleStar}
                    className={`w-full font-semibold h-10 ${isStarred ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700" : "bg-gray-200 hover:bg-gray-300 text-gray-900"}`}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    {isStarred ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" className="w-full text-gray-700 border-gray-300 font-semibold h-10">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
