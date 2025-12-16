"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Shield, Camera, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";

type VerificationStep = "intro" | "document" | "selfie" | "processing" | "complete" | "error";

export default function IdentityVerificationPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<VerificationStep>("intro");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/verification/identity");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const handleStartVerification = async () => {
        try {
            setStep("document");
            // TODO: Initialize Stripe Identity session
            // const response = await fetch('/api/v1/verify/identity/init', { method: 'POST' });
            // const { client_secret } = await response.json();
            // await stripe?.verifyIdentity(client_secret);
        } catch (err) {
            setError("Failed to start verification. Please try again.");
            setStep("error");
        }
    };

    const renderStep = () => {
        switch (step) {
            case "intro":
                return (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Verify Your Identity
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                            Unlock the <span className="font-semibold text-emerald-600">Gold Badge</span> by
                            verifying your identity. This adds +30 points to your Trust Score and
                            opens premium job opportunities.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8 max-w-md mx-auto">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                                What you&apos;ll need:
                            </h3>
                            <ul className="space-y-3 text-left">
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span>Government-issued ID (Passport, Driver&apos;s License)</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <Camera className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span>Camera access for a selfie check</span>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={handleStartVerification}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
                        >
                            Start Verification
                        </button>

                        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" />
                            Powered by Stripe Identity. Your data is never stored on our servers.
                        </p>
                    </div>
                );

            case "document":
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Step 1: Scan Your ID
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Position your ID within the frame
                        </p>

                        {/* Placeholder for Stripe Identity modal */}
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl aspect-[4/3] max-w-md mx-auto flex items-center justify-center">
                            <div className="text-center text-slate-500">
                                <Camera className="w-12 h-12 mx-auto mb-2" />
                                <p>Stripe Identity Modal</p>
                                <p className="text-xs">Integration pending</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep("selfie")}
                            className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                        >
                            Simulate Next →
                        </button>
                    </div>
                );

            case "selfie":
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Step 2: Selfie Check
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Position your face in the oval
                        </p>

                        <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-64 h-64 mx-auto flex items-center justify-center border-4 border-dashed border-emerald-300 dark:border-emerald-700">
                            <Camera className="w-16 h-16 text-slate-400" />
                        </div>

                        <button
                            onClick={() => setStep("processing")}
                            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg"
                        >
                            Capture →
                        </button>
                    </div>
                );

            case "processing":
                return (
                    <div className="text-center py-12">
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-emerald-600 animate-spin" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Verifying...
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            This usually takes less than 30 seconds.
                        </p>

                        <button
                            onClick={() => setStep("complete")}
                            className="mt-8 px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm"
                        >
                            Simulate Complete
                        </button>
                    </div>
                );

            case "complete":
                return (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Identity Verified! 🎉
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            You&apos;ve earned the <span className="font-semibold text-emerald-600">Gold Badge</span> and
                            +30 Trust Score points.
                        </p>

                        <button
                            onClick={() => router.push("/verification")}
                            className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Return to Trust Center
                        </button>
                    </div>
                );

            case "error":
                return (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Verification Failed
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            {error || "Something went wrong. Please try again."}
                        </p>

                        <button
                            onClick={() => setStep("intro")}
                            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                        >
                            Try Again
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Progress indicator */}
            {step !== "intro" && step !== "complete" && step !== "error" && (
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        {["document", "selfie", "processing"].map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                        ? "bg-emerald-600 text-white"
                                        : ["document", "selfie", "processing"].indexOf(step) > i
                                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50"
                                            : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                                    }`}>
                                    {i + 1}
                                </div>
                                {i < 2 && (
                                    <div className={`w-12 h-0.5 ${["document", "selfie", "processing"].indexOf(step) > i
                                            ? "bg-emerald-600"
                                            : "bg-slate-200 dark:bg-slate-700"
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {renderStep()}
        </div>
    );
}
