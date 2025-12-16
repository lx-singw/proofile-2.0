"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    X,
    Zap,
    ExternalLink,
    CheckCircle,
    FileText,
    Clock,
    BarChart,
    Shield,
    ArrowRight
} from "lucide-react";

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: {
        id: string;
        title: string;
        company: string;
        companyLogo?: string;
        externalUrl?: string;
    };
    isAuthenticated?: boolean;
}

const PROOFILE_BENEFITS = [
    { icon: <Zap className="w-4 h-4" />, text: "One-click apply with verified profile" },
    { icon: <FileText className="w-4 h-4" />, text: "AI tailors your resume automatically" },
    { icon: <BarChart className="w-4 h-4" />, text: "Track all applications in one place" },
    { icon: <Clock className="w-4 h-4" />, text: "Get notified when jobs match your skills" },
    { icon: <Shield className="w-4 h-4" />, text: "Verified profiles get 3x more responses" },
];

export function ApplyModal({
    isOpen,
    onClose,
    job,
    isAuthenticated = false,
}: ApplyModalProps) {
    const [hoveredOption, setHoveredOption] = useState<"proofile" | "external" | null>(null);

    if (!isOpen) return null;

    const handleExternalApply = () => {
        if (job.externalUrl) {
            window.open(job.externalUrl, "_blank", "noopener,noreferrer");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-100 dark:border-gray-700">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="absolute top-4 right-4 rounded-full h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        How would you like to apply?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {job.title} at {job.company}
                    </p>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">
                    {/* Option 1: Quick Apply with Proofile */}
                    <div
                        onMouseEnter={() => setHoveredOption("proofile")}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={`
                            relative border-2 rounded-xl p-5 transition-all cursor-pointer
                            ${hoveredOption === "proofile"
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"}
                        `}
                    >
                        {/* Recommended Badge */}
                        <div className="absolute -top-3 right-4 px-3 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                            Recommended
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Quick Apply with Proofile
                                </h3>

                                {/* Benefits List */}
                                <ul className="mt-3 space-y-2">
                                    {PROOFILE_BENEFITS.map((benefit, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            {benefit.text}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                {isAuthenticated ? (
                                    <Button className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-xl">
                                        <Zap className="w-4 h-4 mr-2" />
                                        Quick Apply Now
                                    </Button>
                                ) : (
                                    <Link href={`/signup?redirect=/jobs/${job.id}/apply`} className="block mt-4">
                                        <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-xl">
                                            Create Free Account
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                )}

                                {!isAuthenticated && (
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                        Already have an account?{" "}
                                        <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                            Sign in
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* Option 2: Apply on Company Website */}
                    <div
                        onMouseEnter={() => setHoveredOption("external")}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={`
                            border rounded-xl p-5 transition-all cursor-pointer
                            ${hoveredOption === "external"
                                ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                                : "border-gray-200 dark:border-gray-700"}
                        `}
                        onClick={handleExternalApply}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <ExternalLink className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Apply on Company Website
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    You'll be redirected to {job.company}'s careers page
                                </p>
                            </div>

                            <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        By applying, you agree to our{" "}
                        <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
