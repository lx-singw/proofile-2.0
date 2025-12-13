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
import DashboardHeader from "@/components/layout/DashboardHeader";
import verificationService, { VerificationSummary } from "@/services/verificationService";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface VerificationItem {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    status: "verified" | "pending" | "not_started";
    points: number;
    onVerify?: () => void;
    comingSoon?: boolean;
}

export default function VerificationPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [summary, setSummary] = useState<VerificationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: "email" | "phone";
    }>({ isOpen: false, type: "email" });

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

    // Build verification items list
    const verificationItems: VerificationItem[] = [
        {
            id: "email",
            icon: <Mail className="w-5 h-5" />,
            title: "Email Verified",
            status: summary?.email_verified ? "verified" : "not_started",
            points: 20,
            onVerify: () => setModalState({ isOpen: true, type: "email" }),
        },
        {
            id: "phone",
            icon: <Smartphone className="w-5 h-5" />,
            title: "Phone Verified",
            status: summary?.phone_verified ? "verified" : "not_started",
            points: 20,
            onVerify: () => setModalState({ isOpen: true, type: "phone" }),
        },
        {
            id: "education",
            icon: <GraduationCap className="w-5 h-5" />,
            title: "Education Verified",
            subtitle: "Stanford University", // This would come from user data
            status: "not_started",
            points: 15,
            comingSoon: true,
        },
        {
            id: "employment",
            icon: <Briefcase className="w-5 h-5" />,
            title: "Employment",
            subtitle: "TechCorp", // This would come from user data
            status: "pending",
            points: 15,
            comingSoon: true,
        },
        {
            id: "skills",
            icon: <Award className="w-5 h-5" />,
            title: "Skills Assessment",
            status: "not_started",
            points: 15,
            comingSoon: true,
        },
        {
            id: "background",
            icon: <FileCheck className="w-5 h-5" />,
            title: "Background Check",
            status: "not_started",
            points: 15,
            comingSoon: true,
        },
    ];

    // Get next steps (pending/not started items)
    const nextSteps = verificationItems.filter(
        item => item.status !== "verified" && !item.comingSoon
    );

    if (authLoading || (loading && !summary)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                            Verification Center
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Verify your identity and credentials to build trust and unlock more opportunities.
                        </p>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Verification Status</h2>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {verificationPercentage}% <span className="text-lg font-normal text-gray-500">Complete</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${verificationPercentage}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {verificationPercentage < 50
                            ? "Complete more verifications to build trust with employers"
                            : verificationPercentage < 100
                                ? "You're making great progress! Complete remaining verifications."
                                : "🎉 Fully verified! You stand out to employers."
                        }
                    </p>
                </div>

                {/* Verification Checklist */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Verification Checklist</h2>
                    <div className="space-y-3">
                        {verificationItems.map(item => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.status === "verified"
                                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50"
                                        : item.status === "pending"
                                            ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50"
                                            : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Icon */}
                                    <div className={`flex-shrink-0 ${item.status === "verified"
                                            ? "text-green-600"
                                            : item.status === "pending"
                                                ? "text-yellow-600"
                                                : "text-gray-400"
                                        }`}>
                                        {item.status === "verified" ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : item.status === "pending" ? (
                                            <Clock className="w-6 h-6" />
                                        ) : (
                                            <Circle className="w-6 h-6" />
                                        )}
                                    </div>

                                    {/* Icon */}
                                    <div className={`p-2 rounded-lg ${item.status === "verified"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                            : item.status === "pending"
                                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                                                : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                                        }`}>
                                        {item.icon}
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <h3 className={`font-medium ${item.status === "verified"
                                                ? "text-green-800 dark:text-green-300"
                                                : item.status === "pending"
                                                    ? "text-yellow-800 dark:text-yellow-300"
                                                    : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                            {item.status === "verified" ? "✓ " : item.status === "pending" ? "⏳ " : "○ "}
                                            {item.title}
                                            {item.subtitle && (
                                                <span className="font-normal text-gray-500"> ({item.subtitle})</span>
                                            )}
                                        </h3>
                                        {item.status === "not_started" && (
                                            <p className="text-xs text-gray-500">Not Started</p>
                                        )}
                                        {item.status === "pending" && (
                                            <p className="text-xs text-yellow-600">Pending Verification</p>
                                        )}
                                    </div>
                                </div>

                                {/* Points/Action */}
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                        +{item.points} pts
                                    </span>
                                    {item.status !== "verified" && !item.comingSoon && item.onVerify && (
                                        <button
                                            onClick={item.onVerify}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Verify
                                        </button>
                                    )}
                                    {item.comingSoon && (
                                        <span className="text-xs text-gray-400">Coming Soon</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Steps */}
                {nextSteps.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Next Steps</h2>
                        <div className="space-y-4">
                            {nextSteps.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            Complete {item.title.toLowerCase().replace("verified", "verification")}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={item.onVerify}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                    >
                                        Verify {item.title.split(" ")[0]} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* Skills Assessment CTA */}
                            <div className="flex items-center gap-4 opacity-50">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-sm">
                                    {nextSteps.length + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-600 dark:text-gray-400">
                                        Verify your top skills
                                    </h4>
                                </div>
                                <span className="text-xs text-gray-400">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Why Verify Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Sparkles className="w-6 h-6 text-blue-600" />
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
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Employers trust verified profiles</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Build credibility with potential employers</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                                <Award className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Higher job match quality</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Get matched with better opportunities</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                <Eye className="w-5 h-5 text-blue-600" />
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
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                        Manage all verifications in Settings <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </main>

            <VerificationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                type={modalState.type}
                onSuccess={handleSuccess}
                initialValue={modalState.type === 'email' ? user?.email : ''}
            />
        </div>
    );
}
