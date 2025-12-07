"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Shield, CheckCircle, Clock, Circle, Mail, Phone, GraduationCap, Building2, Award, Lock, ArrowRight } from "lucide-react";

export default function VerificationPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/verification');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const verificationItems = [
        { label: "Email Verified", icon: Mail, status: "verified", description: "Your email has been verified" },
        { label: "Phone Verified", icon: Phone, status: "verified", description: "Your phone number is verified" },
        { label: "Education", icon: GraduationCap, status: "pending", description: "Verify your educational background" },
        { label: "Employment", icon: Building2, status: "not_started", description: "Verify your work history" },
        { label: "Skills Assessment", icon: Award, status: "not_started", description: "Take skill assessments" },
        { label: "Background Check", icon: Lock, status: "not_started", description: "Optional enhanced verification" },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "verified":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "pending":
                return <Clock className="w-5 h-5 text-yellow-500" />;
            default:
                return <Circle className="w-5 h-5 text-gray-300" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "verified":
                return <span className="text-green-600 text-sm font-medium">Verified</span>;
            case "pending":
                return <span className="text-yellow-600 text-sm font-medium">Pending</span>;
            default:
                return <span className="text-gray-400 text-sm font-medium">Not Started</span>;
        }
    };

    const verifiedCount = verificationItems.filter(item => item.status === "verified").length;
    const percentage = Math.round((verifiedCount / verificationItems.length) * 100);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <Shield className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Verification Center
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Build trust with verified credentials
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Verification Progress
                        </h2>
                        <span className="text-2xl font-bold text-green-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                        <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {verifiedCount} of {verificationItems.length} verifications complete
                    </p>
                </div>

                {/* Verification Items */}
                <div className="space-y-4 mb-8">
                    {verificationItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-green-500 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                {getStatusIcon(item.status)}
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {item.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusLabel(item.status)}
                                {item.status !== "verified" && (
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Why verify?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">3x more profile views</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">Employers trust verified profiles</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">Higher job match quality</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">Stand out from competition</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
