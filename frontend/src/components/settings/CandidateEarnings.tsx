"use client";

import React, { useState, useEffect } from "react";
import {
    CreditCard,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    DollarSign,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import { toast } from "@/lib/toast";

export default function CandidateEarnings() {
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const checkStatus = async () => {
        try {
            setIsLoading(true);
            const status = await paymentService.getOnboardingStatus();
            setIsOnboarded(status.is_onboarded);
        } catch (error) {
            console.error("Failed to check payment status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const handleOnboard = async () => {
        try {
            setIsRefreshing(true);
            const returnUrl = window.location.origin + "/settings/payments?status=return";
            const refreshUrl = window.location.origin + "/settings/payments?status=refresh";
            const response = await paymentService.getOnboardingLink(returnUrl, refreshUrl);
            window.location.href = response.url;
        } catch (error) {
            toast.error("Failed to generate onboarding link");
        } finally {
            setIsRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-500" />
                    Earnings & Payments
                </h2>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    Powered by Stripe
                </span>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border-2 transition-all ${isOnboarded
                    ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20"
                    : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-500/20"
                }`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${isOnboarded ? "bg-emerald-500" : "bg-amber-500"
                        }`}>
                        {isOnboarded ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-white" />
                        )}
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {isOnboarded ? "Professional Wallet Active" : "Setup Required"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {isOnboarded
                                ? "You are ready to receive payments from the Paid Inbox and Skill Bounties."
                                : "Finish setting up your professional wallet to start earning from priority messages and community contributions."}
                        </p>

                        {!isOnboarded && (
                            <Button
                                onClick={handleOnboard}
                                disabled={isRefreshing}
                                className="mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 transition-all font-bold"
                            >
                                {isRefreshing ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CreditCard className="w-4 h-4 mr-2" />
                                )}
                                Connect Stripe to Start Earning
                            </Button>
                        )}

                        {isOnboarded && (
                            <Button
                                variant="outline"
                                onClick={handleOnboard}
                                className="mt-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Stripe Dashboard
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Earned</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">R 0.00</div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Next payout in 7 days</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Paid Messages</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Global fee: R 20.00 / msg</p>
                </div>
            </div>
        </div>
    );
}
