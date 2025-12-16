"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Shield,
    CheckCircle,
    Smartphone,
    Mail,
    Briefcase,
    Award,
    Lock,
    ArrowLeft,
    Clock,
    Circle,
    GraduationCap,
    FileCheck,
    ChevronRight,
    Sparkles,
    TrendingUp,
    Users,
    Eye
} from "lucide-react";
import { VerificationModal } from "@/components/verification/VerificationModal";
import { EmploymentVerificationModal } from "@/components/verification/EmploymentVerificationModal";

import verificationService, { VerificationSummary } from "@/services/verificationService";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import AssetWallet from "@/components/verification/AssetWallet";
import TrustScoreRing from "@/components/verification/dashboard/TrustScoreRing";
import PeerVerificationHub from "@/components/verification/PeerVerificationHub";
import { VerificationStatsBar } from "@/components/ui/QuickStatsBar";
import { FadeIn } from "@/components/ui/PageTransition";
import HelpTooltip, { HELP_CONTENT } from "@/components/ui/HelpTooltip";

export default function VerificationPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [summary, setSummary] = useState<VerificationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: "email" | "phone";
    }>({ isOpen: false, type: "email" });
    const [employmentModalOpen, setEmploymentModalOpen] = useState(false);

    const { refetch: refetchProfile } = useProfile();

    const fetchSummary = async () => {
        try {
            const data = await verificationService.getVerificationSummary();
            setSummary(data);
        } catch (error) {
            console.error("Failed to fetch verification summary", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSummary();
        }
    }, [user]);

    const handleSuccess = () => {
        fetchSummary();
        refetchProfile();
    };

    // Calculate verification percentage
    const calculatePercentage = () => {
        if (!summary) return 0;
        let score = 0;
        if (summary.email_verified) score += 20;
        if (summary.phone_verified) score += 20;
        if (summary.identity_verified) score += 30;
        // Add more verification types here
        return Math.min(score, 100);
    };

    const verificationPercentage = calculatePercentage();

    if (authLoading || (loading && !summary)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Quick Stats Bar */}
            <VerificationStatsBar
                verifiedPercent={summary?.verification_score || 0}
                pending={summary?.pending_count || 0}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FadeIn>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-8 h-8 text-green-600" />
                                Verification Center
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Verify your identity and credentials to build trust and unlock more opportunities.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/verification/history"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Clock className="w-4 h-4" />
                                History
                            </Link>
                            <Link
                                href="/verification/identity"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Lock className="w-4 h-4" />
                                Identity
                            </Link>
                            <Link
                                href={`/p/${user?.username || 'me'}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Public Profile
                            </Link>
                        </div>
                    </div>

                    {/* Progress Card with Trust Score Ring */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-6">
                            {/* Trust Score Ring */}
                            <TrustScoreRing score={summary?.verification_score || 0} size={100} />

                            {/* Score Details */}
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Your Trust Score
                                </h2>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${summary?.verification_score || 0}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {(summary?.verification_score || 0) < 50
                                        ? "Complete more verifications to build trust with employers"
                                        : (summary?.verification_score || 0) < 100
                                            ? "You're making great progress! Complete remaining verifications."
                                            : "🎉 Fully verified! You stand out to employers."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Asset Wallet (New Design) */}
                    <div className="mb-8">
                        <AssetWallet
                            verifications={summary?.verifications || []}
                            onVerifyClick={(type) => {
                                if (type === 'email') setModalState({ isOpen: true, type: 'email' });
                                if (type === 'phone') setModalState({ isOpen: true, type: 'phone' });
                                if (type === 'employment') setEmploymentModalOpen(true);
                                // Future: Handle Identity and Skills
                            }}
                        />
                    </div>

                    {/* Peer Employment Verification */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 mb-8 border border-emerald-100 dark:border-emerald-900/30">
                        <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Employment Verification</h2>
                        <p className="text-emerald-700 dark:text-emerald-300 mb-6">
                            We use a crowdsourced trust graph. Verify your work history by asking peers who worked with you at the same time.
                        </p>
                        <PeerVerificationHub />
                    </div>

                    {/* Why Verify Section */}
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Why verify?</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">3x more profile views</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Verified profiles get significantly more attention from recruiters</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Employers trust verified profiles</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Build credibility with potential employers</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                                    <Award className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Higher job match quality</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Get matched with better opportunities</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                                    <Eye className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Stand out from competition</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Differentiate yourself in a crowded job market</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Link to Settings */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/settings?tab=verification"
                            className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                        >
                            Manage all verifications in Settings <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </FadeIn>
            </main>

            <VerificationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                type={modalState.type}
                onSuccess={handleSuccess}
                initialValue={modalState.type === 'email' ? user?.email : ''}
            />

            <EmploymentVerificationModal
                isOpen={employmentModalOpen}
                onClose={() => setEmploymentModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
