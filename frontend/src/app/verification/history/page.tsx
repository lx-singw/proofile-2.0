"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Clock, Shield, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface VerificationEvent {
    id: string;
    type: "identity" | "employment" | "education" | "skill";
    action: string;
    status: "success" | "failed" | "pending";
    timestamp: string;
    details: string;
    actor?: string;
}

// Mock data - replace with API call
const mockHistory: VerificationEvent[] = [
    {
        id: "1",
        type: "identity",
        action: "Identity Verification Initiated",
        status: "success",
        timestamp: new Date().toISOString(),
        details: "Stripe Identity session started",
        actor: "system"
    },
    {
        id: "2",
        type: "employment",
        action: "Work Email Verified",
        status: "success",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        details: "Domain techcorp.com confirmed",
        actor: "domain_auth"
    },
    {
        id: "3",
        type: "skill",
        action: "Peer Verification Request Sent",
        status: "pending",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        details: "Awaiting response from jane@company.com",
        actor: "user"
    }
];

export default function VerificationHistoryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<VerificationEvent[]>([]);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/verification/history");
        }
    }, [user, loading, router]);

    useEffect(() => {
        // TODO: Fetch from API
        setHistory(mockHistory);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case "failed":
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-emerald-500" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "identity":
                return <Shield className="w-5 h-5" />;
            case "employment":
            case "education":
                return <FileText className="w-5 h-5" />;
            default:
                return <CheckCircle className="w-5 h-5" />;
        }
    };

    const filteredHistory = filter === "all"
        ? history
        : history.filter(e => e.type === filter);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Verification History
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Complete audit trail of all verification events on your profile.
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {["all", "identity", "employment", "skill"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-6">
                    {filteredHistory.map((event) => (
                        <div key={event.id} className="relative flex gap-4">
                            <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${event.status === "success"
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                                    : event.status === "failed"
                                        ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                                }`}>
                                {getTypeIcon(event.type)}
                            </div>

                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            {event.action}
                                        </h3>
                                        {getStatusIcon(event.status)}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(event.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {event.details}
                                </p>
                                {event.actor && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                        Actor: {event.actor}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredHistory.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No verification events found.
                </div>
            )}
        </div>
    );
}
