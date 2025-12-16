"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignupIncentiveProps {
    variant?: "sidebar" | "banner" | "modal";
}

export default function SignupIncentive({ variant = "sidebar" }: SignupIncentiveProps) {
    const benefits = [
        { icon: Zap, text: "One-click applications" },
        { icon: CheckCircle, text: "Verified profile stands out" },
        { icon: TrendingUp, text: "Track all your applications" },
    ];

    if (variant === "banner") {
        return (
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-3 px-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-medium">
                            Create a free Proofile account and get matched to jobs that fit your skills
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/register">
                            <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                                Sign Up Free
                            </Button>
                        </Link>
                        <Link href="/login" className="text-sm text-blue-100 hover:text-white hover:underline">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === "modal") {
        return (
            <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Get More From Your Job Search
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create a free Proofile account to unlock AI-powered job matching and one-click applications.
                </p>
                <div className="space-y-3 mb-6">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3 text-left">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <benefit.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{benefit.text}</span>
                        </div>
                    ))}
                </div>
                <Link href="/register">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3">
                        Create Free Account
                    </Button>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
                </p>
            </div>
        );
    }

    // Default sidebar variant
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-5">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">Get Matched</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create a free profile and get AI-matched to jobs that fit your skills.
            </p>
            <ul className="space-y-2 mb-4">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <benefit.icon className="w-4 h-4 text-green-500" />
                        {benefit.text}
                    </li>
                ))}
            </ul>
            <Link href="/register">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    Create Free Account
                </Button>
            </Link>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
        </div>
    );
}
