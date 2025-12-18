"use client";

import React, { useState } from "react";
import {
    Send,
    ShieldCheck,
    Lock,
    Info,
    CreditCard,
    DollarSign,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import { toast } from "@/lib/toast";

interface RecruiterInboxProps {
    recipientId: number;
    recipientName: string;
    recipientPhoto?: string;
    onClose?: () => void;
}

export default function RecruiterInbox({
    recipientId,
    recipientName,
    recipientPhoto,
    onClose
}: RecruiterInboxProps) {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const FEE_AMOUNT = 20.0; // ZAR

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error("Message cannot be empty");
            return;
        }

        try {
            setIsSubmitting(true);

            // Generate return URLs
            const successUrl = window.location.origin + "/messages?payment=success";
            const cancelUrl = window.location.origin + "/messages?payment=cancel";

            const response = await paymentService.initiatePaidMessage({
                recipientId,
                amount: FEE_AMOUNT,
                message: message.trim(),
                successUrl,
                cancel_url: cancelUrl // Note: the service uses snake_case internally for API request but matching params here
            });

            // Redirect to Stripe Checkout
            window.location.href = response.url;
        } catch (error: any) {
            console.error("Payment initiation failed:", error);
            toast.error(error.message || "Failed to initiate priority message");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 max-w-lg w-full">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <div className="flex items-center gap-4">
                    {recipientPhoto ? (
                        <img src={recipientPhoto} alt={recipientName} className="w-12 h-12 rounded-full border-2 border-white/50" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                            {recipientName.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Paid Priority Inbox</h3>
                        <p className="text-white/80 text-xs">Direct message to {recipientName}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Transparency Notice */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-500/20 flex gap-3 text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="text-gray-700 dark:text-gray-300">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Guaranteed Visibility</p>
                        <p className="mt-0.5">Your message will bypass standard filters and alert the recipient immediately. 100% of the fee (minus platform costs) goes directly to the candidate.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Your Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi there, I saw your verified profile and would love to chat about a role at..."
                        className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-gray-900 dark:text-white"
                        maxLength={500}
                    />
                    <div className="flex justify-end text-[10px] text-gray-400 px-1">
                        {message.length} / 500 characters
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">Priority Delivery Fee</span>
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    The fee ensures zero-noise communication and rewards verified candidates for their time.
                                </div>
                            </div>
                        </div>
                        <span className="text-xl font-black text-gray-900 dark:text-white">R {FEE_AMOUNT.toFixed(2)}</span>
                    </div>

                    <Button
                        onClick={handleSendMessage}
                        disabled={isSubmitting || !message.trim()}
                        className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-[1.02] transition-all font-bold text-lg shadow-xl shadow-gray-500/10"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-3" />
                                Pay & Send Now
                            </>
                        )}
                    </Button>

                    <p className="text-center text-[10px] text-gray-400 mt-4 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" />
                        Secure Payment via Stripe • Fully encrypted
                    </p>
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
    );
}
