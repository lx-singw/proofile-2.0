"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowRight, Sparkles } from "lucide-react";

interface UpsellBannerProps {
    currentLevel: "bronze" | "silver" | "gold" | "none";
    targetCompany?: string;
    onDismiss?: () => void;
}

export default function UpsellBanner({
    currentLevel,
    targetCompany,
    onDismiss,
}: UpsellBannerProps) {
    if (currentLevel === "gold") return null;

    const getMessage = () => {
        if (targetCompany) {
            return {
                title: `${targetCompany} prefers Gold-verified candidates`,
                subtitle: "Complete your identity verification to stand out from the competition.",
                cta: "Get Gold Badge",
                href: "/verification/identity"
            };
        }

        switch (currentLevel) {
            case "none":
                return {
                    title: "Start building your Trust Score",
                    subtitle: "Verified profiles get 5x more responses from recruiters.",
                    cta: "Begin Verification",
                    href: "/verification"
                };
            case "bronze":
                return {
                    title: "Upgrade to Silver",
                    subtitle: "Verify your work history to unlock more job opportunities.",
                    cta: "Verify Employment",
                    href: "/dashboard/verification"
                };
            case "silver":
                return {
                    title: "Unlock the Gold Badge",
                    subtitle: "Complete identity verification for the highest trust level.",
                    cta: "Get Gold Badge",
                    href: "/verification/identity"
                };
            default:
                return null;
        }
    };

    const content = getMessage();
    if (!content) return null;

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-0.5">
            <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 rounded-[10px] p-4">
                {/* Sparkle decorations */}
                <Sparkles className="absolute top-2 right-2 w-5 h-5 text-amber-400 opacity-50" />
                <Sparkles className="absolute bottom-2 right-8 w-4 h-4 text-yellow-400 opacity-40" />

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {content.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {content.subtitle}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={content.href}
                        className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                        {content.cta}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute top-2 right-2 text-amber-600/50 hover:text-amber-600 dark:text-amber-400/50 dark:hover:text-amber-400"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
