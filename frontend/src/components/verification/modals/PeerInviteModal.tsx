"use client";

import React, { useState } from "react";
import { X, Users, Mail, MessageSquare, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface PeerInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetItem?: {
        type: "employment" | "skill";
        title: string;
        company?: string;
    };
    onSubmit: (invites: PeerInvite[]) => Promise<void>;
}

interface PeerInvite {
    email: string;
    relationship: string;
    message?: string;
}

const RELATIONSHIPS = [
    { value: "manager", label: "Manager" },
    { value: "colleague", label: "Colleague" },
    { value: "direct_report", label: "Direct Report" },
    { value: "mentor", label: "Mentor" },
    { value: "client", label: "Client" },
];

const BLOCKED_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];

export default function PeerInviteModal({
    isOpen,
    onClose,
    targetItem,
    onSubmit,
}: PeerInviteModalProps) {
    const [step, setStep] = useState<"form" | "message" | "sending" | "complete">("form");
    const [invites, setInvites] = useState<PeerInvite[]>([{ email: "", relationship: "colleague" }]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const validateEmail = (email: string) => {
        const domain = email.split("@")[1]?.toLowerCase();
        if (BLOCKED_DOMAINS.includes(domain)) {
            return "Please use a work email address";
        }
        if (!email.includes("@") || !email.includes(".")) {
            return "Invalid email format";
        }
        return null;
    };

    const updateInvite = (index: number, field: keyof PeerInvite, value: string) => {
        const updated = [...invites];
        updated[index] = { ...updated[index], [field]: value };
        setInvites(updated);
        setError(null);
    };

    const addInvite = () => {
        if (invites.length < 5) {
            setInvites([...invites, { email: "", relationship: "colleague" }]);
        }
    };

    const removeInvite = (index: number) => {
        if (invites.length > 1) {
            setInvites(invites.filter((_, i) => i !== index));
        }
    };

    const handleNext = () => {
        // Validate all emails
        const validInvites = invites.filter(i => i.email.trim());
        if (validInvites.length === 0) {
            setError("Please add at least one email");
            return;
        }

        for (const invite of validInvites) {
            const emailError = validateEmail(invite.email);
            if (emailError) {
                setError(emailError);
                return;
            }
        }

        setStep("message");
    };

    const handleSubmit = async () => {
        setStep("sending");
        try {
            const validInvites = invites
                .filter(i => i.email.trim())
                .map(i => ({ ...i, message }));
            await onSubmit(validInvites);
            setStep("complete");
        } catch {
            setError("Failed to send invites. Please try again.");
            setStep("form");
        }
    };

    const handleClose = () => {
        setStep("form");
        setInvites([{ email: "", relationship: "colleague" }]);
        setMessage("");
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Request Peer Verification
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === "form" && (
                        <>
                            {targetItem && (
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Validating: <span className="font-medium text-slate-900 dark:text-white">{targetItem.title}</span>
                                        {targetItem.company && ` at ${targetItem.company}`}
                                    </p>
                                </div>
                            )}

                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Invite colleagues who can vouch for your experience. They&apos;ll receive an email request.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                {invites.map((invite, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                value={invite.email}
                                                onChange={(e) => updateInvite(index, "email", e.target.value)}
                                                placeholder="colleague@company.com"
                                                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            />
                                        </div>
                                        <select
                                            value={invite.relationship}
                                            onChange={(e) => updateInvite(index, "relationship", e.target.value)}
                                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        >
                                            {RELATIONSHIPS.map((r) => (
                                                <option key={r.value} value={r.value}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>
                                        {invites.length > 1 && (
                                            <button
                                                onClick={() => removeInvite(index)}
                                                className="p-2 text-slate-400 hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {invites.length < 5 && (
                                <button
                                    onClick={addInvite}
                                    className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                >
                                    + Add another
                                </button>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}

                    {step === "message" && (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-slate-400" />
                                <span className="font-medium text-slate-900 dark:text-white">
                                    Add a personal message (optional)
                                </span>
                            </div>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hey! Could you verify my role at the company? It would really help my job search."
                                rows={4}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                            />

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Sending to: {invites.filter(i => i.email).map(i => i.email).join(", ")}
                            </p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setStep("form")}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Requests
                                </button>
                            </div>
                        </>
                    )}

                    {step === "sending" && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-10 h-10 mx-auto mb-4 text-emerald-600 animate-spin" />
                            <p className="text-slate-600 dark:text-slate-400">
                                Sending verification requests...
                            </p>
                        </div>
                    )}

                    {step === "complete" && (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Requests Sent!
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                We&apos;ll notify you when your peers respond.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
