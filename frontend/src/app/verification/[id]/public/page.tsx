"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, ExternalLink, Copy, Calendar } from "lucide-react";

interface PublicProofPageProps {
    params: { id: string };
}

// This would be fetched from API based on ID
const mockVerification = {
    id: "ver_123456",
    type: "identity" as const,
    level: "gold" as const,
    holderName: "Linda Singwane",
    issuer: "Stripe Identity",
    issuedAt: "2024-01-15T10:00:00Z",
    expiresAt: null,
    status: "verified" as const,
    metadata: {
        documentType: "Passport",
        country: "ZA"
    }
};

export default function PublicProofPage({ params }: PublicProofPageProps) {
    const [copied, setCopied] = React.useState(false);
    const shareUrl = typeof window !== "undefined"
        ? window.location.href
        : `https://proofile.com/verification/${params.id}/public`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getLevelStyles = (level: string) => {
        switch (level) {
            case "gold":
                return "from-emerald-400 via-emerald-300 to-emerald-500 border-emerald-300";
            case "silver":
                return "from-slate-300 via-slate-200 to-slate-400 border-slate-300";
            default:
                return "from-emerald-400 via-emerald-300 to-emerald-500 border-emerald-300";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* The Verification Card */}
                <div className={`relative rounded-2xl bg-gradient-to-br ${getLevelStyles(mockVerification.level)} p-0.5 shadow-2xl`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 overflow-hidden">
                        {/* Holographic effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

                        {/* Badge tier label */}
                        <div className="text-center mb-6">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${mockVerification.level === "gold"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : mockVerification.level === "silver"
                                        ? "bg-slate-400/20 text-slate-300"
                                        : "bg-emerald-500/20 text-emerald-300"
                                }`}>
                                <Shield className="w-3 h-3" />
                                {mockVerification.level} Tier
                            </span>
                        </div>

                        {/* Main content */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white mb-1">
                                {mockVerification.type === "identity" ? "Identity Verified" : "Verification"}
                            </h1>
                            <p className="text-slate-400">
                                Issued to <span className="text-white font-medium">{mockVerification.holderName}</span>
                            </p>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Issuer</span>
                                <span className="text-slate-300">{mockVerification.issuer}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Verification ID</span>
                                <span className="text-slate-300 font-mono text-xs">{mockVerification.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Issued</span>
                                <span className="text-slate-300 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(mockVerification.issuedAt).toLocaleDateString()}
                                </span>
                            </div>
                            {mockVerification.metadata.documentType && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Document Type</span>
                                    <span className="text-slate-300">{mockVerification.metadata.documentType}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-700">
                            <p className="text-center text-xs text-slate-500 mb-3">
                                Verified by Proofile Trust Protocol
                            </p>
                            <a
                                href="https://proofile.com/verify"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                            >
                                Learn more <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Share section */}
                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-3">Share this verification</p>
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>
            </div>
        </div>
    );
}
