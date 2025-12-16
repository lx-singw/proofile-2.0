"use client";

import React, { useState } from "react";
import {
    X,
    Send,
    Link as LinkIcon,
    Mail,
    MessageCircle,
    Phone,
    Copy,
    Check,
    Loader2,
    Share2
} from "lucide-react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";

interface RequestRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const RELATIONSHIP_TYPES = [
    { id: "colleague", label: "Colleague" },
    { id: "manager", label: "Manager (they managed me)" },
    { id: "direct_report", label: "Direct Report (I managed them)" },
    { id: "client", label: "Client" },
];

interface RatingRequestResponse {
    id: number;
    token: string;
    share_links: {
        direct: string;
        whatsapp: string;
        sms: string;
        email_subject: string;
        email_body: string;
    };
    requester_name: string;
}

export function RequestRatingModal({ isOpen, onClose, onSuccess }: RequestRatingModalProps) {
    const [step, setStep] = useState<"form" | "share" | "submitting">("form");
    const [copied, setCopied] = useState<string | null>(null);
    const [shareLinks, setShareLinks] = useState<{
        direct: string;
        whatsapp: string;
        sms: string;
        email_subject: string;
        email_body: string;
    } | null>(null);

    const [formData, setFormData] = useState({
        invitee_name: "",
        invitee_email: "",
        invitee_phone: "",
        relationship_type: "colleague",
        company: "",
        role_at_company: "",
        personal_message: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.invitee_name || !formData.company) {
            toast.error("Please fill in name and company");
            return;
        }

        setStep("submitting");

        try {
            const params = new URLSearchParams();
            Object.entries(formData).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const data = await apiRequest<RatingRequestResponse>({
                method: "POST",
                url: `/api/v1/rating-requests?${params.toString()}`,
            });

            setShareLinks(data.share_links);
            setStep("share");
            toast.success("Rating request created!");
        } catch (error: any) {
            toast.error(error?.detail || "Failed to create request");
            setStep("form");
        }
    };


    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
        toast.success("Copied to clipboard!");
    };

    const handleClose = () => {
        setStep("form");
        setShareLinks(null);
        setFormData({
            invitee_name: "",
            invitee_email: "",
            invitee_phone: "",
            relationship_type: "colleague",
            company: "",
            role_at_company: "",
            personal_message: "",
        });
        onClose();
        if (step === "share") onSuccess?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Send className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {step === "share" ? "Share Rating Request" : "Request a Rating"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {step === "share" ? "Send the link to get rated" : "Invite someone to rate you"}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {step === "form" && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Their Name *
                            </label>
                            <input
                                type="text"
                                value={formData.invitee_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, invitee_name: e.target.value }))}
                                placeholder="e.g. John Smith"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email (optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.invitee_email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, invitee_email: e.target.value }))}
                                    placeholder="john@company.com"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone (optional)
                                </label>
                                <input
                                    type="tel"
                                    value={formData.invitee_phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, invitee_phone: e.target.value }))}
                                    placeholder="+27..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        {/* Relationship */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Their Relationship to You *
                            </label>
                            <select
                                value={formData.relationship_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, relationship_type: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {RELATIONSHIP_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Company */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Company Where You Worked Together *
                            </label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                placeholder="e.g. TechCorp"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Personal Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Personal Message (optional)
                            </label>
                            <textarea
                                value={formData.personal_message}
                                onChange={(e) => setFormData(prev => ({ ...prev, personal_message: e.target.value }))}
                                placeholder="Hi! I'd appreciate if you could take a moment to rate our professional experience..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[80px]"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            Create & Share Request
                        </button>
                    </form>
                )}

                {step === "submitting" && (
                    <div className="p-12 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Creating your request...</p>
                    </div>
                )}

                {step === "share" && shareLinks && (
                    <div className="p-6 space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center mb-4">
                            <p className="text-green-700 dark:text-green-300 font-medium">
                                ✓ Request created for {formData.invitee_name}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Expires in 30 days
                            </p>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                            Choose how to share:
                        </p>

                        {/* Share Buttons */}
                        <div className="space-y-3">
                            {/* Copy Link */}
                            <button
                                onClick={() => copyToClipboard(shareLinks.direct, "link")}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">Copy Link</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                        {shareLinks.direct}
                                    </p>
                                </div>
                                {copied === "link" ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* WhatsApp */}
                            <a
                                href={shareLinks.whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <MessageCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">Share via WhatsApp</p>
                                    <p className="text-xs text-gray-500">Quick message with link</p>
                                </div>
                            </a>

                            {/* Email */}
                            <a
                                href={`mailto:${formData.invitee_email}?subject=${encodeURIComponent(shareLinks.email_subject)}&body=${encodeURIComponent(shareLinks.email_body)}`}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Mail className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">Send Email</p>
                                    <p className="text-xs text-gray-500">Professional email template</p>
                                </div>
                            </a>

                            {/* SMS */}
                            <a
                                href={shareLinks.sms}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Phone className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">Send SMS</p>
                                    <p className="text-xs text-gray-500">Short message with link</p>
                                </div>
                            </a>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
