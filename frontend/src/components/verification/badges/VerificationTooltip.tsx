"use client";

import React from "react";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface VerificationTooltipProps {
    type: "identity" | "employment" | "education" | "skill";
    method: string;
    verifiedAt: string;
    issuer?: string;
    trustLevel?: "high" | "medium" | "low";
    children: React.ReactNode;
}

export default function VerificationTooltip({
    type,
    method,
    verifiedAt,
    issuer = "Proofile",
    trustLevel = "high",
    children,
}: VerificationTooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);

    const getTrustLevelColor = () => {
        switch (trustLevel) {
            case "high":
                return "text-emerald-600 dark:text-emerald-400";
            case "medium":
                return "text-emerald-600 dark:text-emerald-400";
            case "low":
                return "text-red-600 dark:text-red-400";
        }
    };

    const getTrustLevelBg = () => {
        switch (trustLevel) {
            case "high":
                return "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800";
            case "medium":
                return "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800";
            case "low":
                return "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
        }
    };

    const formatMethod = (m: string) => {
        const methods: Record<string, string> = {
            "stripe": "Stripe Identity",
            "domain_email": "Corporate Domain Authentication",
            "document_ocr": "Document Verification",
            "peer": "Peer Verification",
            "test": "Assessment",
        };
        return methods[m] || m;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            {isVisible && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                    <div className={`w-64 p-3 rounded-lg border shadow-lg ${getTrustLevelBg()}`}>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className={`w-4 h-4 ${getTrustLevelColor()}`} />
                            <span className={`font-semibold text-sm ${getTrustLevelColor()}`}>
                                Verified by {issuer}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Method:</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    {formatMethod(method)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                    {formatDate(verifiedAt)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">Trust Level:</span>
                                <span className={`font-medium capitalize ${getTrustLevelColor()}`}>
                                    {trustLevel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 border-r border-b ${getTrustLevelBg()}`} />
                </div>
            )}
        </div>
    );
}
