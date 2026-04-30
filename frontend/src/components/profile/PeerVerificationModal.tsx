"use client";

import { useState, useEffect } from "react";
import {
    X,
    UserCheck,
    Search,
    Mail,
    CheckCircle2,
    AlertCircle,
    Building2,
    Clock,
    Send,
    Loader2
} from "lucide-react";
import { FadeIn } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/button";
import verificationService, { PeerOpportunity } from "@/services/verificationService";
import { toast } from "@/lib/toast";

interface PeerVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    experienceId?: string;
    company: string;
    role: string;
    onSuccess?: () => void;
}

export function PeerVerificationModal({
    isOpen,
    onClose,
    experienceId,
    company,
    role,
    onSuccess
}: PeerVerificationModalProps) {
    const [opportunities, setOpportunities] = useState<PeerOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPeer, setSelectedPeer] = useState<number | null>(null);
    const [message, setMessage] = useState(`Hi! Could you please verify that we worked together at ${company}? This helps me build my professional trust score. Thanks!`);

    useEffect(() => {
        if (isOpen) {
            fetchOpportunities();
        }
    }, [isOpen]);

    const fetchOpportunities = async () => {
        setIsLoading(true);
        try {
            const data = await verificationService.getOpportunities();
            // Filter opportunities for this specific company
            const filtered = data.filter(opt => opt.company.toLowerCase() === company.toLowerCase());
            setOpportunities(filtered);
        } catch (error) {
            console.error("Failed to fetch opportunities:", error);
            toast.error("Failed to load potential verifiers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!selectedPeer) return;

        setIsSubmitting(true);
        try {
            await verificationService.requestVerification({
                verifier_id: selectedPeer,
                experience_id: experienceId,
                company,
                role,
                message
            });
            toast.success("Verification request sent!");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to send request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
            <FadeIn className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Peer Verification</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Verify your experience at {company}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            Peers at {company}
                        </label>

                        {isLoading ? (
                            <div className="flex flex-col items-center py-8">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                                <p className="text-sm text-gray-500">Finding colleagues...</p>
                            </div>
                        ) : opportunities.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {opportunities.map((opt) => (
                                    <button
                                        key={opt.user.id}
                                        onClick={() => setSelectedPeer(opt.user.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left ${selectedPeer === opt.user.id
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-sm shadow-emerald-500/10'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold overflow-hidden border border-gray-200 dark:border-gray-600">
                                            {opt.user.avatar_url ? (
                                                <img src={opt.user.avatar_url} alt={opt.user.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                opt.user.full_name?.charAt(0) ?? '?'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-gray-900 dark:text-white">{opt.user.full_name}</h4>
                                                {selectedPeer === opt.user.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{opt.user.headline || "Proofile Professional"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">No peers found on Proofile yet</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                            Invite a colleague via email to verify you and help grow the network.
                                        </p>
                                        <button className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700">
                                            <Mail className="w-4 h-4" />
                                            Invite Colleague via Email
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Personal Message (Optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-24 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
                                placeholder="Type your message..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-12"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendRequest}
                        disabled={!selectedPeer || isSubmitting}
                        className="flex-[2] rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Request
                    </Button>
                </div>
            </FadeIn>
        </div>
    );
}
