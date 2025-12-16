"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle, Shield, Briefcase, GraduationCap, Star } from "lucide-react";

interface VerificationItem {
    id: string;
    type: "identity" | "employment" | "education" | "skill";
    title: string;
    subtitle?: string;
    status: "verified" | "pending" | "expired" | "unverified";
    method?: string;
    verifiedAt?: string;
    expiresAt?: string;
}

interface VerificationListProps {
    items: VerificationItem[];
    onVerify?: (item: VerificationItem) => void;
    onViewDetails?: (item: VerificationItem) => void;
}

export default function VerificationList({
    items,
    onVerify,
    onViewDetails
}: VerificationListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const getIcon = (type: string) => {
        switch (type) {
            case "identity":
                return Shield;
            case "employment":
                return Briefcase;
            case "education":
                return GraduationCap;
            case "skill":
                return Star;
            default:
                return CheckCircle;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
            case "expired":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                        <AlertCircle className="w-3 h-3" />
                        Expired
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Not Verified
                    </span>
                );
        }
    };

    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
    }, {} as Record<string, VerificationItem[]>);

    const typeLabels: Record<string, string> = {
        identity: "Identity",
        employment: "Employment",
        education: "Education",
        skill: "Skills"
    };

    return (
        <div className="space-y-4">
            {Object.entries(groupedItems).map(([type, typeItems]) => {
                const Icon = getIcon(type);
                const verifiedCount = typeItems.filter(i => i.status === "verified").length;

                return (
                    <div
                        key={type}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Section header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {typeLabels[type] || type}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    ({verifiedCount}/{typeItems.length} verified)
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {typeItems.map((item) => (
                                <div key={item.id} className="group">
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedId === item.id ? (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {item.title}
                                                </p>
                                                {item.subtitle && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {item.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>

                                    {/* Expanded details */}
                                    {expandedId === item.id && (
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                {item.method && (
                                                    <div>
                                                        <span className="text-slate-500 dark:text-slate-400">Method:</span>
                                                        <p className="text-slate-700 dark:text-slate-300">{item.method}</p>
                                                    </div>
                                                )}
                                                {item.verifiedAt && (
                                                    <div>
                                                        <span className="text-slate-500 dark:text-slate-400">Verified:</span>
                                                        <p className="text-slate-700 dark:text-slate-300">
                                                            {new Date(item.verifiedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {item.status !== "verified" && onVerify && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onVerify(item);
                                                        }}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                                                    >
                                                        Verify Now
                                                    </button>
                                                )}
                                                {onViewDetails && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onViewDetails(item);
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
