"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicProfile, PublicProfile } from "@/services/profileService";
import ProofileLogo from "@/components/branding/ProofileLogo";
import {
    Shield,
    Star,
    MapPin,
    Briefcase,
    FileText,
    Download,
    Share2,
    CheckCircle,
    Globe,
    Calendar,
    Eye,
    EyeOff,
    ThumbsUp,
    TrendingUp,
    Award,
    AlertTriangle
} from "lucide-react";
import { toast } from "@/lib/toast";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import {
    StarProfileButton,
    WatchProfileButton,
    FollowButton,
    ConnectButton,
    CoffeeChatButton,
    SendMessageButton,
    EndorseSkillButton,
    ProfileStatsCompact
} from "@/components/social/SocialActions";
import { ProfileModeToggle } from "@/components/profile/ProfileModeToggle";
import { CollaboratorsList } from "@/components/profile/CollaboratorsList";

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const username = params.username as string;

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        // Handle special case: /p/me redirects to current user's public profile
        if (username === "me" && user?.username) {
            router.replace(`/p/${user.username}`);
            return;
        }

        // If /p/me but user not logged in, show not found
        if (username === "me" && !user) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        async function loadProfile() {
            try {
                const data = await getPublicProfile(username);
                setProfile(data);
            } catch (error: any) {
                console.error("Failed to load public profile", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }

        if (username && username !== "me") {
            loadProfile();
        }
    }, [username, user, router]);

    const handleShare = () => {
        const url = `${window.location.origin}/p/${username}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 px-6 py-4">
                    <ProofileLogo size={32} showWordmark={true} />
                </header>
                <main className="max-w-6xl mx-auto px-4 py-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-6xl">🔍</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Not Found</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        This profile doesn't exist or is set to private.
                    </p>
                    <Link
                        href="/"
                        className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = user?.username === username;

    // Mock profile stats - in production these would come from API
    const profileStats = {
        profileViews: 234,
        followerCount: 45,
        starCount: 12,
        rating: 4.8,
        ratingCount: 12
    };

    // Mock skills for endorsement demo
    const skills = [
        { name: "Product Management", endorsements: 8, isEndorsed: false },
        { name: "Agile/Scrum", endorsements: 6, isEndorsed: false },
        { name: "Data Analysis", endorsements: 5, isEndorsed: false },
        { name: "Strategic Planning", endorsements: 4, isEndorsed: false },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Mode Toggle for Owner */}
            {isOwnProfile && (
                <ProfileModeToggle
                    currentMode="preview"
                    username={username}
                    isPrivate={profile.is_private}
                />
            )}

            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/">
                        <ProofileLogo size={32} showWordmark={true} />
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleShare}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>

                        {isOwnProfile && (
                            <Link
                                href="/settings"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Edit Profile
                            </Link>
                        )}

                        {!user && (
                            <Link
                                href="/register"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                Claim Your Identity
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Private Profile Warning Banner */}
            {profile.is_private && isOwnProfile && (
                <div className="max-w-5xl mx-auto px-4 pt-6">
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <EyeOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-yellow-800 dark:text-yellow-300 font-medium">Your profile is set to private</p>
                            <p className="text-yellow-700 dark:text-yellow-400 text-sm">Only you can see this preview. Other people won't be able to view your profile unless you make it public.</p>
                        </div>
                        <Link
                            href="/settings?tab=profile"
                            className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors flex-shrink-0"
                        >
                            Make Public
                        </Link>
                    </div>
                </div>
            )}

            <main className="max-w-5xl mx-auto px-4 py-12">
                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                            {profile.full_name?.charAt(0)?.toUpperCase() || profile.username.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                        {profile.full_name || profile.username}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Verified
                                    </div>
                                </div>
                            </div>

                            {profile.bio && (
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {profile.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                {profile.industry && (
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        {profile.industry}
                                    </div>
                                )}
                                {profile.persona && (
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4" />
                                        {profile.persona}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    proofile.co/p/{profile.username}
                                </div>
                            </div>

                            {/* Rating display */}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-gray-900 dark:text-white">{profileStats.rating}/5.0</span>
                                    <span className="text-sm text-gray-500">({profileStats.ratingCount} ratings)</span>
                                </div>
                                <ProfileStatsCompact
                                    profileViews={profileStats.profileViews}
                                    followerCount={profileStats.followerCount}
                                    starCount={profileStats.starCount}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Actions Bar */}
                    {!isOwnProfile && user && profile && (
                        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <FollowButton userId={profile.user_id} followerCount={profileStats.followerCount} />
                            <StarProfileButton userId={profile.user_id} starCount={profileStats.starCount} />
                            <WatchProfileButton userId={profile.user_id} />
                            <ConnectButton userId={profile.user_id} />
                            <CoffeeChatButton />
                            <SendMessageButton />
                        </div>
                    )}
                </div>

                {/* Skills Section with Endorsements */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6" />
                        Skills & Endorsements
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skills.map((skill) => (
                            <div
                                key={skill.name}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h4>
                                        <p className="text-xs text-gray-500">{skill.endorsements} endorsements</p>
                                    </div>
                                </div>
                                {!isOwnProfile && user && profile && (
                                    <EndorseSkillButton
                                        userId={profile.user_id}
                                        skillName={skill.name}
                                        isEndorsed={skill.isEndorsed}
                                        endorsementCount={skill.endorsements}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Verified Work Graph */}
                <div className="mb-8">
                    <CollaboratorsList userId={profile.user_id} isOwnProfile={isOwnProfile} />
                </div>

                {/* Resumes Section */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        Resumes
                    </h2>

                    {profile.resumes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No resumes published yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {profile.resumes.map((resume) => (
                                <div
                                    key={resume.id}
                                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {resume.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(resume.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                                    {resume.template_id}
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/resume/${resume.id}`}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA for non-logged-in users */}
                {!user && (
                    <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-3xl p-8 border border-green-200 dark:border-green-800 text-center">
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Create Your Own Professional Identity
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Join thousands of professionals building verified, shareable profiles on Proofile.
                            </p>
                            <Link
                                href="/register"
                                className="inline-block px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Get Started - It's Free
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
