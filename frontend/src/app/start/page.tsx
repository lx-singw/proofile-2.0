"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import ProofileLogo from "@/components/branding/ProofileLogo";

/**
 * StartPage - "Don't Make Me Think" Redesign
 * 
 * Following Steve Krug's principles:
 * - One question per screen
 * - Two clear paths: "I have a resume" vs "I'll build one"
 * - Show progress
 * - Allow going back
 */
export default function StartPage() {
    const router = useRouter();
    const [hasResume, setHasResume] = useState<boolean | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-all duration-200 hover:scale-[1.02]">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
                    <ProofileLogo size={32} showWordmark={true} />
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-16 px-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-12">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <div className={`w-3 h-3 rounded-full ${hasResume !== null ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                </div>

                {/* Single Question */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Do you have a resume?
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        We&apos;ll customize your experience based on your answer.
                    </p>
                </div>

                {/* Two Clear Choices */}
                <div className="space-y-4 mb-12">
                    {/* Option 1: Yes, I have a resume */}
                    <button
                        onClick={() => setHasResume(true)}
                        className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${hasResume === true
                                ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${hasResume === true
                                ? 'border-green-600 bg-green-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                            {hasResume === true && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Upload className="w-6 h-6 text-green-600" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    Yes, I have one
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Upload your existing resume and we&apos;ll enhance it with AI
                            </p>
                        </div>
                    </button>

                    {/* Option 2: No, I'll build one */}
                    <button
                        onClick={() => setHasResume(false)}
                        className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${hasResume === false
                                ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${hasResume === false
                                ? 'border-green-600 bg-green-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                            {hasResume === false && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-6 h-6 text-emerald-600" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    No, I&apos;ll build one
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Answer a few quick questions and we&apos;ll create your resume
                            </p>
                        </div>
                    </button>
                </div>

                {/* Primary CTA - Only enabled when choice is made */}
                <div className="space-y-4">
                    <button
                        onClick={() => {
                            if (hasResume === true) {
                                router.push('/resume/upload');
                            } else if (hasResume === false) {
                                router.push('/resume/build');
                            }
                        }}
                        disabled={hasResume === null}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${hasResume !== null
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Secondary: Login for existing users */}
                    <div className="text-center">
                        <Link
                            href="/login"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 hover:scale-[1.02]"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>
                </div>

                {/* Reassurance */}
                <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Takes about 2 minutes • No credit card required</p>
                </div>
            </main>
        </div>
    );
}
