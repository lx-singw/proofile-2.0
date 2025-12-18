"use client";

import React from "react";
import {
    Lock,
    ShieldAlert,
    Zap,
    ArrowRight,
    Search,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GuildGateProps {
    requiredScore: number;
    currentScore: number;
    guildName: string;
    children: React.ReactNode;
}

export default function GuildGate({ requiredScore, currentScore, guildName, children }: GuildGateProps) {
    const isLocked = currentScore < requiredScore;

    if (!isLocked) return <>{children}</>;

    const missingPoints = requiredScore - currentScore;

    return (
        <div className="relative min-h-[400px] rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-900/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center p-8">
            {/* Blurred Content Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none blur-md overflow-hidden">
                {children}
            </div>

            <div className="relative z-10 max-w-sm w-full text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 mb-2 relative">
                    <Lock className="w-8 h-8" />
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full border-4 border-gray-50 dark:border-gray-900">
                        <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Access Restricted</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        The <span className="font-bold text-gray-900 dark:text-white">{guildName}</span> is an exclusive community. You need <span className="font-black text-amber-600">{missingPoints} more trust points</span> to enter.
                    </p>
                </div>

                {/* Score Progress */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl shadow-gray-500/5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-gray-400">Your Reputation</span>
                        <span className="text-amber-600">{currentScore} / {requiredScore}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000"
                            style={{ width: `${(currentScore / requiredScore) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Link href="/profile?boost=trust" className="block">
                        <Button className="w-full h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:scale-[1.02] transition-all">
                            <Zap className="w-4 h-4 mr-2 fill-amber-400 text-amber-400" />
                            Boost TrustScore Now
                        </Button>
                    </Link>

                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center justify-center w-full gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Learn about Trust Tiers
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
