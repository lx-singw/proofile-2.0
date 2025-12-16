"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { User, Check, X, Building2, Calendar, UserPlus, Shield } from "lucide-react";
import Image from "next/image";

interface Suggestion {
    user: {
        id: number;
        full_name: string;
        headline?: string;
        avatar_url?: string;
    };
    company: string;
    role?: string;
    period?: string;
}

interface PendingRequest {
    id: number;
    requester: {
        id: number;
        full_name: string;
        avatar_url?: string;
    };
    company: string;
    role?: string;
    message?: string;
    created_at: string;
}

export default function PeerVerificationHub() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [respondingId, setRespondingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [opps, pending] = await Promise.all([
                apiRequest<Suggestion[]>({ method: "GET", url: "/api/v1/verifications/peer/opportunities" }),
                apiRequest<PendingRequest[]>({ method: "GET", url: "/api/v1/verifications/peer/pending" })
            ]);
            setSuggestions(opps);
            setPendingRequests(pending);
        } catch (error) {
            console.error("Failed to fetch peer verification data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSendRequest = async (suggestion: Suggestion) => {
        const id = `${suggestion.user.id}-${suggestion.company}`;
        setSendingId(id);
        try {
            await apiRequest({
                method: "POST",
                url: "/api/v1/verifications/peer/request",
                params: {
                    verifier_id: suggestion.user.id,
                    company: suggestion.company,
                    role: suggestion.role,
                }
            });
            toast.success(`Request sent to ${suggestion.user.full_name}`);
            setSuggestions(prev => prev.filter(s => s.user.id !== suggestion.user.id || s.company !== suggestion.company));
        } catch (error) {
            toast.error("Failed to send request");
        } finally {
            setSendingId(null);
        }
    };

    const handleRespond = async (id: number, action: "verify" | "deny") => {
        setRespondingId(id);
        try {
            await apiRequest({
                method: "POST",
                url: `/api/v1/verifications/peer/${id}/respond`,
                params: { action }
            });
            toast.success(action === "verify" ? "Work history verified!" : "Request denied");
            setPendingRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast.error("Failed to respond");
        } finally {
            setRespondingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-40 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-900/30">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-yellow-500" />
                        Verify Your Peers
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
                                <div className="flex items-start gap-4">
                                    {req.requester.avatar_url ? (
                                        <Image src={req.requester.avatar_url} alt={req.requester.full_name} width={48} height={48} className="rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            Did <span className="font-bold">{req.requester.full_name}</span> work at <span className="font-bold">{req.company}</span>?
                                        </p>
                                        {req.role && <p className="text-sm text-gray-500 mt-1">{req.role}</p>}
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleRespond(req.id, "verify")}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Yes, Verify
                                            </button>
                                            <button
                                                onClick={() => handleRespond(req.id, "deny")}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Opportunities Section */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    Verify Your History
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    We found people who worked at the same companies as you. Ask them to verify your employment to boost your trust score.
                </p>

                {suggestions.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Peer Suggestions Yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            Add your work history to your profile. We'll automatically find colleagues who can verify your employment.
                        </p>
                        <a
                            href="/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Complete Work History
                        </a>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {suggestions.map((s, i) => (
                            <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    {s.user.avatar_url ? (
                                        <Image src={s.user.avatar_url} alt={s.user.full_name} width={40} height={40} className="rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{s.user.full_name}</h3>
                                        <p className="text-xs text-gray-500">{s.user.headline || "Peer"}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg mb-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                        <Building2 className="w-3 h-3" />
                                        <span className="font-medium">{s.company}</span>
                                    </div>
                                    {s.role && (
                                        <div className="text-gray-500 text-xs ml-5">{s.role}</div>
                                    )}
                                    {s.period && (
                                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-2 ml-5">
                                            <Calendar className="w-3 h-3" />
                                            {s.period}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleSendRequest(s)}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Ask to Verify
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
