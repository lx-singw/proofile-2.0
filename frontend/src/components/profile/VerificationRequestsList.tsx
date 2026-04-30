"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare,
    ShieldCheck,
    Loader2,
    Calendar,
    ArrowRight
} from "lucide-react";
import verificationService, { PeerVerificationRequest } from "@/services/verificationService";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function VerificationRequestsList() {
    const [requests, setRequests] = useState<PeerVerificationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await verificationService.getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch pending requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (requestId: number, action: "verify" | "deny") => {
        setProcessingId(requestId);
        try {
            await verificationService.respondToRequest(requestId, action);
            toast.success(action === "verify" ? "Work history verified!" : "Request denied");
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            toast.error("Failed to process request");
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Checking for verification requests...</p>
            </div>
        );
    }

    if (requests.length === 0) {
        return null; // Don't show anything if no requests
    }

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 border border-emerald-100 dark:border-emerald-900/40 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Pending Verifications
                    <span className="flex items-center justify-center w-5 h-5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] rounded-full font-bold ml-1">
                        {requests.length}
                    </span>
                </h3>
            </div>

            <div className="space-y-4">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className="group p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 shadow-sm"
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Requester Info */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100 dark:border-emerald-800 overflow-hidden">
                                    {request.requester?.avatar_url ? (
                                        <img src={request.requester.avatar_url} alt={request.requester.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        request.requester?.full_name?.charAt(0) ?? '?'
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                        {request.requester?.full_name}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 uppercase tracking-wider font-medium">
                                        <Clock className="w-3 h-3" />
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Verification Details */}
                            <div className="flex-1">
                                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Claims to have worked at <span className="font-bold text-emerald-700 dark:text-emerald-400">{request.company}</span>
                                        {request.role && <> as <span className="font-medium">{request.role}</span></>}
                                    </p>
                                    {request.message && (
                                        <div className="mt-2 flex gap-2 text-xs text-gray-500 italic">
                                            <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                            "{request.message}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row sm:flex-col gap-2 justify-center">
                                <Button
                                    onClick={() => handleAction(request.id, "verify")}
                                    disabled={processingId === request.id}
                                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-lg shadow-emerald-500/10"
                                >
                                    {processingId === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Verify
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleAction(request.id, "deny")}
                                    disabled={processingId === request.id}
                                    className="h-9 px-4 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs gap-1.5"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Deny
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-center">
                <p className="text-[10px] text-gray-500 flex items-center gap-1.5 uppercase tracking-widest font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Verifying others builds your trust score
                </p>
            </div>
        </div>
    );
}
