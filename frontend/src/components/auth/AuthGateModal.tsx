"use client";

import React from "react";
import Link from "next/link";
import {
    Sparkles,
    CheckCircle,
    Zap,
    TrendingUp,
    X,
    ArrowRight,
    ShieldCheck,
    Users
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AuthGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    actionType?: "apply" | "social" | "save" | "generic";
    redirectPath?: string;
}

export function AuthGateModal({
    isOpen,
    onClose,
    title,
    description,
    actionType = "generic",
    redirectPath
}: AuthGateModalProps) {
    const pathname = usePathname();
    const finalRedirect = redirectPath || pathname;

    if (!isOpen) return null;

    const contentMap = {
        apply: {
            title: title || "Apply with Your Verified Profile",
            description: description || "Create a free account to apply with one click and stand out to recruiters with your verified achievements.",
            badge: "Most Popular"
        },
        social: {
            title: title || "Join the Professional Graph",
            description: description || "Sign in to follow professionals, endorse skills, and build your verified network on Proofile.",
            badge: "Network"
        },
        save: {
            title: title || "Save for Later",
            description: description || "Don't lose this opportunity. Sign in to save jobs and get personalized alerts when similar roles open up.",
            badge: "Save"
        },
        generic: {
            title: title || "Unlock the Full Proofile Experience",
            description: description || "Join thousands of professionals building verified, shareable identities and discovering elite opportunities.",
            badge: "Join Now"
        }
    };

    const config = contentMap[actionType];

    const benefits = [
        { icon: Zap, text: "One-click AI-powered applications", color: "text-amber-500" },
        { icon: ShieldCheck, text: "Verified profile badge for trust", color: "text-emerald-500" },
        { icon: TrendingUp, text: "Career growth & match tracking", color: "text-blue-500" },
        { icon: Users, text: "Verified professional network", color: "text-purple-500" },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-100/20 dark:border-emerald-800/20 animate-in zoom-in-95 fade-in duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header/Gradient Top */}
                <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
                    <div className="absolute inset-x-0 bottom-0 px-8 pb-4">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded-full border border-white/20">
                            {config.badge}
                        </span>
                    </div>
                </div>

                <div className="p-8 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/20">
                            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {config.title}
                        </h2>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {config.description}
                    </p>

                    {/* Benefits List */}
                    <div className="space-y-4 mb-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-4 group">
                                <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm`}>
                                    <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{benefit.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="grid gap-3">
                        <Link href={`/register?redirect=${encodeURIComponent(finalRedirect)}`}>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-6 text-lg font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]">
                                Create Free Account
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link href={`/login?redirect=${encodeURIComponent(finalRedirect)}`} onClick={onClose} className="w-full text-center">
                            <Button variant="ghost" className="w-full text-gray-600 dark:text-gray-400 hover:text-emerald-600 py-3 font-medium">
                                Already have an account? Sign In
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                        By joining, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
